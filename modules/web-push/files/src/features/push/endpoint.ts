// The server sends requests to whatever address is stored, so only the browsers' push services are accepted.
// The database checks the same rule (see the migration): change both together.
const pushService = /^https:\/\/(?:fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|(?:[a-z0-9-]+\.)*push\.apple\.com|(?:[a-z0-9-]+\.)*notify\.windows\.com)\/\S*$/;
const maximumLength = 2048;

export function isPushServiceEndpoint(endpoint: string): boolean {
  return endpoint.length <= maximumLength && pushService.test(endpoint);
}
