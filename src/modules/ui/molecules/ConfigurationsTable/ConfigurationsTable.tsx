import { Text, EditIcon } from "@saleor/macaw-ui/next";
import Link from "next/link";
import { ConfigurationSummary } from "../ConfigurationSummary/ConfigurationSummary";
import * as tableStyles from "./configurationsTable.css";
import { Tr, Td, Table, Tbody, Th, Thead } from "@/modules/ui/atoms/Table/Table";
import { type PaymentAppConfigEntry } from "@/modules/payment-app-configuration/config-entry";

const ConfigurationsTableRow = ({ item }: { item: PaymentAppConfigEntry }) => {
  return (
    <Tr>
      <Td>
        <Text variant="bodyStrong" size="medium">
          {item.configurationName}
        </Text>
      </Td>
      <Td className={tableStyles.summaryColumnTd}>
        <ConfigurationSummary config={item} />
      </Td>
      <Td className={tableStyles.actionsColumnTd}>
        <Link href={`/configurations/edit/${item.configurationId}`} passHref legacyBehavior>
          <Text
            as="a"
            size="medium"
            color="textNeutralSubdued"
            textDecoration="none"
            display="inline-flex"
            alignItems="center"
          >
            <EditIcon size="small" />
            Edit
          </Text>
        </Link>
      </Td>
    </Tr>
  );
};

export const ConfigurationsTable = ({
  configurations,
}: {
  configurations: PaymentAppConfigEntry[];
}) => {
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Configuration name</Th>
          <Th className={tableStyles.summaryColumnTd}>Adyen Configuration</Th>
          <Th className={tableStyles.actionsColumnTd}>
            <span className="visually-hidden">Actions</span>
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {configurations.map((item) => (
          <ConfigurationsTableRow key={item.configurationId} item={item} />
        ))}
      </Tbody>
    </Table>
  );
};
