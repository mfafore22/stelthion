import type {
  CronRunRequest,
  CronRunResponse,
  HealthResponse,
  MarketConfig,
  MarketConfigUpdate,
  MarketDetail,
  MarketListResponse,
  PhenomenaListResponse,
  PhenomenonDetail,
  PhenomenonLinkCreate,
  PhenomenonLinkRow,
  PhenomenonLinksResponse,
  PhenomenonStateValue,
  ReviewApproveResponse,
  ReviewListResponse,
  ReviewRejectResponse,
  ReviewStatus,
  SignalOfTheDayResponse,
} from '@stelthion/shoppermind-client-types';
import { request, type FetchOptions } from './fetch.js';

export * from './errors.js';
export type * from '@stelthion/shoppermind-client-types';

export interface ShopperMindClientOptions {
  baseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
  retries?: number;
  backoffMs?: number;
  timeoutMs?: number;
}

export class ShopperMindClient {
  private opts: FetchOptions;

  constructor(opts: ShopperMindClientOptions) {
    this.opts = {
      baseUrl: opts.baseUrl,
      token: opts.token,
      fetchImpl: opts.fetchImpl,
      retries: opts.retries,
      backoffMs: opts.backoffMs,
      timeoutMs: opts.timeoutMs,
    };
  }

  listMarkets(): Promise<MarketListResponse> {
    return request<MarketListResponse>(this.opts, 'GET', 'v1/markets');
  }

  getMarket(marketId: string): Promise<MarketDetail> {
    return request<MarketDetail>(this.opts, 'GET', `v1/markets/${encodeURIComponent(marketId)}`);
  }

  listPhenomena(args: {
    marketId: string;
    state?: PhenomenonStateValue;
    limit?: number;
  }): Promise<PhenomenaListResponse> {
    return request<PhenomenaListResponse>(this.opts, 'GET', 'v1/phenomena', {
      query: { marketId: args.marketId, state: args.state, limit: args.limit },
    });
  }

  getPhenomenon(id: string): Promise<PhenomenonDetail> {
    return request<PhenomenonDetail>(this.opts, 'GET', `v1/phenomena/${encodeURIComponent(id)}`);
  }

  getPhenomenonLinks(id: string): Promise<PhenomenonLinksResponse> {
    return request<PhenomenonLinksResponse>(
      this.opts,
      'GET',
      `v1/phenomena/${encodeURIComponent(id)}/links`,
    );
  }

  getSignalOfTheDay(args: { marketId: string; date?: string }): Promise<SignalOfTheDayResponse> {
    return request<SignalOfTheDayResponse>(this.opts, 'GET', 'v1/signals-of-the-day', {
      query: { marketId: args.marketId, date: args.date },
    });
  }

  listReview(args: {
    marketId: string;
    status?: ReviewStatus;
    page?: number;
    pageSize?: number;
  }): Promise<ReviewListResponse> {
    return request<ReviewListResponse>(this.opts, 'GET', 'v1/review', {
      query: {
        marketId: args.marketId,
        status: args.status,
        page: args.page,
        pageSize: args.pageSize,
      },
    });
  }

  approveReviewItem(id: string, args: { userId: string; note?: string }): Promise<ReviewApproveResponse> {
    return request<ReviewApproveResponse>(this.opts, 'POST', `v1/review/${encodeURIComponent(id)}/approve`, {
      body: args,
    });
  }

  rejectReviewItem(id: string, args: { userId: string; note?: string }): Promise<ReviewRejectResponse> {
    return request<ReviewRejectResponse>(this.opts, 'POST', `v1/review/${encodeURIComponent(id)}/reject`, {
      body: args,
    });
  }

  // Admin — requires internal token in `ShopperMindClientOptions.token`.
  getMarketConfig(marketId: string): Promise<MarketConfig> {
    return request<MarketConfig>(
      this.opts,
      'GET',
      `v1/markets/${encodeURIComponent(marketId)}/config`,
    );
  }

  updateMarketConfig(marketId: string, body: MarketConfigUpdate): Promise<MarketConfig> {
    return request<MarketConfig>(
      this.opts,
      'PUT',
      `v1/markets/${encodeURIComponent(marketId)}/config`,
      { body },
    );
  }

  createPhenomenonLink(
    fromPhenomenonId: string,
    body: PhenomenonLinkCreate,
  ): Promise<PhenomenonLinkRow> {
    return request<PhenomenonLinkRow>(
      this.opts,
      'POST',
      `v1/phenomena/${encodeURIComponent(fromPhenomenonId)}/links`,
      { body },
    );
  }
}

// Internal-token-only surface: cron trigger + health.
export class ShopperMindInternalClient {
  private opts: FetchOptions;

  constructor(opts: ShopperMindClientOptions) {
    this.opts = opts;
  }

  runCron(body: CronRunRequest = {}): Promise<CronRunResponse> {
    return request<CronRunResponse>(this.opts, 'POST', 'internal/cron/run', { body });
  }

  health(): Promise<HealthResponse> {
    return request<HealthResponse>(this.opts, 'GET', 'internal/health');
  }
}
