/** Extract configuration from iframe URL search params */
export interface IframeConfig {
  token: string;
  baseUrl: string;
  programShortname: string;
}

export function getIframeConfig(): IframeConfig {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') ?? '';
  const baseUrl = params.get('baseurl') ?? '';
  const programShortname = params.get('program') ?? 'C450';

  if (!token) {
    throw new Error('Missing required "token" URL parameter');
  }
  if (!baseUrl) {
    throw new Error('Missing required "baseurl" URL parameter');
  }

  return { token, baseUrl, programShortname };
}
