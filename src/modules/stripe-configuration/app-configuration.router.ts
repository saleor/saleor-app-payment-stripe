import { z } from "zod";
import { protectedClientProcedure } from "../trpc/protected-client-procedure";
import { router } from "../trpc/trpc-server";
import {
  adyenConfigEntry,
  adyenInitEntryInputSchema,
  adyenUserVisibleEntryConfig,
} from "./stripe-entries-config";
import { adyenConfigEntriesSchema, channelMappingSchema } from "./app-config";
import { getAppConfigurator } from "./app-configuration-factory";
import {
  addConfigEntry,
  deleteConfigEntry,
  getAllConfigEntriesObfuscated,
  getConfigEntryObfuscated,
  updateConfigEntry,
} from "./config-manager";
import { adyenConfigEntryDelete, adyenConfigEntryUpdate, mappingUpdate } from "./input-schemas";
import { getMappingFromAppConfig, setMappingInAppConfig } from "./mapping-manager";
import { invariant } from "@/lib/invariant";
import { redactLogValue } from "@/lib/logger";

export const appConfigurationRouter = router({
  mapping: router({
    getAll: protectedClientProcedure.output(channelMappingSchema).query(async ({ ctx }) => {
      ctx.logger.info("appConfigurationRouter.mapping.getAll called");
      const configurator = getAppConfigurator(ctx.apiClient, ctx.saleorApiUrl);
      return getMappingFromAppConfig(ctx.apiClient, configurator);
    }),
    update: protectedClientProcedure
      .input(mappingUpdate)
      .output(channelMappingSchema)
      .mutation(async ({ input, ctx }) => {
        const { configurationId, channelId } = input;
        ctx.logger.info(
          { configurationId, channelId },
          "appConfigurationRouter.mapping.update called",
        );

        const configurator = getAppConfigurator(ctx.apiClient, ctx.saleorApiUrl);
        return setMappingInAppConfig(input, configurator);
      }),
  }),
  adyenConfig: router({
    get: protectedClientProcedure
      .input(z.object({ configurationId: z.string() }))
      .output(adyenConfigEntry)
      .query(async ({ input, ctx }) => {
        const { configurationId } = input;
        ctx.logger.info({ configurationId }, "appConfigurationRouter.adyenConfig.getAll called");

        const configurator = getAppConfigurator(ctx.apiClient, ctx.saleorApiUrl);
        return getConfigEntryObfuscated(input.configurationId, configurator);
      }),
    getAll: protectedClientProcedure.output(adyenConfigEntriesSchema).query(async ({ ctx }) => {
      ctx.logger.info("appConfigurationRouter.adyenConfig.getAll called");
      const configurator = getAppConfigurator(ctx.apiClient, ctx.saleorApiUrl);
      return getAllConfigEntriesObfuscated(configurator);
    }),
    add: protectedClientProcedure
      .input(adyenInitEntryInputSchema)
      .mutation(async ({ input, ctx }) => {
        const { configurationName, apiKey, environment } = input;
        ctx.logger.info("appConfigurationRouter.adyenConfig.add called");
        ctx.logger.debug(
          { configurationName, environment, apiKey: redactLogValue(apiKey) },
          "appConfigurationRouter.adyenConfig.add input",
        );

        const configurator = getAppConfigurator(ctx.apiClient, ctx.saleorApiUrl);
        return addConfigEntry(input, configurator);
      }),
    update: protectedClientProcedure
      .input(adyenConfigEntryUpdate)
      .output(adyenUserVisibleEntryConfig)
      .mutation(async ({ input, ctx }) => {
        const { configurationId, entry } = input;
        const { environment, configurationName, merchantAccount, applePayCertificate } = entry;
        ctx.logger.info("appConfigurationRouter.adyenConfig.update called");
        ctx.logger.debug(
          {
            configurationId,
            entry: {
              environment,
              configurationName,
              merchantAccount,
              applePayCertificate: redactLogValue(applePayCertificate),
            },
          },
          "appConfigurationRouter.adyenConfig.update input",
        );
        invariant(ctx.appUrl, "Missing app URL");

        const configurator = getAppConfigurator(ctx.apiClient, ctx.saleorApiUrl);
        return updateConfigEntry(input, configurator, ctx.appUrl);
      }),
    delete: protectedClientProcedure
      .input(adyenConfigEntryDelete)
      .mutation(async ({ input, ctx }) => {
        const { configurationId } = input;
        ctx.logger.info({ configurationId }, "appConfigurationRouter.adyenConfig.delete called");

        const configurator = getAppConfigurator(ctx.apiClient, ctx.saleorApiUrl);
        return deleteConfigEntry(configurationId, configurator);
      }),
  }),
});
