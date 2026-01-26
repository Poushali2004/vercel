import output from '../../output-manager';
import type Client from '../client';
import { APIError } from '../errors-ts';
import type { AcceptedPolicies, AutoProvisionResult, Metadata } from './types';

export async function autoProvisionResource(
  client: Client,
  integrationSlug: string,
  productSlug: string,
  name: string,
  metadata: Metadata,
  acceptedPolicies: AcceptedPolicies
): Promise<AutoProvisionResult> {
  const endpoint = `/v1/integrations/integration/${encodeURIComponent(integrationSlug)}/marketplace/auto-provision/${encodeURIComponent(productSlug)}`;
  const body = {
    name,
    metadata,
    acceptedPolicies,
    source: 'cli',
  };
  output.debug(`Auto-provision request: POST ${endpoint}`);
  output.debug(`Auto-provision body: ${JSON.stringify(body, null, 2)}`);

  try {
    const res = await client.fetch(endpoint, {
      method: 'POST',
      json: false,
      body,
    });

    // 200/201/202 - success
    if (res.ok) {
      return res.json();
    }

    // Shouldn't reach here - client.fetch throws on non-ok responses
    throw new Error(`Auto-provision failed: ${res.status}`);
  } catch (error) {
    // client.fetch throws APIError on 4xx - check if it's a 422 with fallback data
    if (error instanceof APIError && error.status === 422) {
      output.debug(`Auto-provision returned 422 fallback response`);
      // APIError copies response body fields onto itself (kind, url, integration, product, etc.)
      return error as unknown as AutoProvisionResult;
    }

    output.debug(`Auto-provision error: ${error}`);
    // Re-throw other errors (400/403/404/etc)
    throw error;
  }
}
