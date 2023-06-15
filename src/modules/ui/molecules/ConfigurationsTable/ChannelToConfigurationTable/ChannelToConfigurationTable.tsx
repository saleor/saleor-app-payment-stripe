import { Combobox, Text } from "@saleor/macaw-ui/next";
import classNames from "classnames";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import * as tableStyles from "./channelToConfigurationTable.css";
import { Table, Thead, Tr, Th, Tbody, Td } from "@/modules/ui/atoms/Table/Table";
import { ChipDanger, ChipNeutral, ChipSuccess } from "@/modules/ui/atoms/Chip/Chip";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { type Channel } from "@/types";
import { getErrorHandler } from "@/modules/trpc/utils";
import {
  type ChannelMapping,
  type PaymentAppConfigEntries,
} from "@/modules/payment-app-configuration/app-config";
import { type PaymentAppConfigEntry } from "@/modules/payment-app-configuration/config-entry";

const ChannelToConfigurationTableRow = ({
  channel,
  configurations,
  selectedConfigurationId,
  disabled,
}: {
  channel: Channel;
  configurations: PaymentAppConfigEntries;
  selectedConfigurationId?: PaymentAppConfigEntry["configurationId"] | null;
  disabled?: boolean;
}) => {
  const { appBridge } = useAppBridge();
  const selectedConfiguration = configurations.find(
    (config) => config.configurationId === selectedConfigurationId,
  );

  const context = trpcClient.useContext();
  const { mutate: saveMapping } =
    trpcClient.paymentAppConfigurationRouter.mapping.update.useMutation({
      onSettled: () => {
        return context.paymentAppConfigurationRouter.mapping.getAll.invalidate();
      },
      onSuccess: () => {
        void appBridge?.dispatch({
          type: "notification",
          payload: {
            title: "Saved",
            status: "success",
            actionId: "ChannelToConfigurationTableRow",
          },
        });
      },
      onError: (err) => {
        getErrorHandler({
          appBridge,
          actionId: "ChannelToConfigurationTableRow",
          message: "Error while saving mappings",
          title: "Mapping error",
        })(err);
      },
    });

  return (
    <Tr>
      <Td className={tableStyles.td}>
        <Text
          variant="bodyStrong"
          size="medium"
          color={selectedConfigurationId ? "textNeutralDefault" : "textNeutralDisabled"}
        >
          {channel.name}
        </Text>
      </Td>
      <Td className={classNames(tableStyles.td, tableStyles.dropdownColumnTd)}>
        <Combobox
          label="Configuration name"
          size="small"
          disabled={disabled}
          value={selectedConfigurationId || ""}
          onChange={(e) => {
            const newMapping = {
              channelId: channel.id,
              configurationId: String(e),
            };
            context.paymentAppConfigurationRouter.mapping.getAll.setData(undefined, (mappings) => {
              return {
                ...mappings,
                [newMapping.channelId]: newMapping.configurationId,
              };
            });
            saveMapping(newMapping);
          }}
          options={[
            { value: "", label: "(disabled)" },
            ...configurations.map((c) => ({
              value: c.configurationId,
              label: c.configurationName,
            })),
          ]}
        />
      </Td>
      <Td className={classNames(tableStyles.td, tableStyles.statusColumnTd)}>
        {!selectedConfiguration ? (
          <ChipNeutral>Disabled</ChipNeutral>
        ) : selectedConfiguration.environment === "LIVE" ? (
          <ChipSuccess>LIVE</ChipSuccess>
        ) : (
          <ChipDanger>TESTING</ChipDanger>
        )}
      </Td>
    </Tr>
  );
};

export const ChannelToConfigurationTable = ({
  channelMappings,
  channels,
  configurations,
  disabled,
}: {
  channelMappings: ChannelMapping;
  channels: readonly Channel[];
  configurations: PaymentAppConfigEntries;
  disabled?: boolean;
}) => {
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Saleor Channel</Th>
          <Th className={tableStyles.dropdownColumnTd}>Configuration</Th>
          <Th className={tableStyles.statusColumnTd}>
            <span className="visually-hidden">Status</span>
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {Object.entries(channelMappings).map(([channelId, configurationId]) => {
          const channel = channels.find((c) => c.id === channelId);
          if (!channel) {
            return null;
          }

          return (
            <ChannelToConfigurationTableRow
              key={channel.id}
              channel={channel}
              configurations={configurations}
              selectedConfigurationId={configurationId}
              disabled={disabled}
            />
          );
        })}
      </Tbody>
    </Table>
  );
};
