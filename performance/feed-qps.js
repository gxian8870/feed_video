import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

// HTTP 200 does not guarantee that the response contains real feed data.
const invalidFeedResponseRate = new Rate('invalid_feed_response_rate');

export const options = {
  scenarios: {
    feed_qps_test: {
      executor: 'constant-arrival-rate',
      rate: 1000,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 500,
      duration: '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    invalid_feed_response_rate: ['rate<0.01'],
  },
};

const url = 'http://localhost:8080/feed/listLatest';

const body = JSON.stringify({
  limit: 10,
  latest_time: 0,
});

const params = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: '3s',
};


export default function () {
  const response = http.post(url, body, params);

  let responseBody = null;

  try {
    responseBody = response.json();
  } catch (_) {
    // A non-JSON response is handled by the checks below.
  }

  const isStatusOK = response.status === 200;
  const isJSON = responseBody !== null && typeof responseBody === 'object';
  const hasVideoList = isJSON && Array.isArray(responseBody.video_list);
  const hasRealVideoData = hasVideoList && responseBody.video_list.length > 0;
  const isValidFeedResponse = isStatusOK && hasRealVideoData;

  check(response, {
    'HTTP status is 200': () => isStatusOK,
    'response is valid JSON': () => isJSON,
    'video_list is an array': () => hasVideoList,
    'video_list is not empty': () => hasRealVideoData,
  });

  invalidFeedResponseRate.add(!isValidFeedResponse);
}
