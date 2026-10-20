import { Typography } from 'antd';

const PRIVACY_URL = 'https://www.spotify.com/account/privacy/';

/** How to request the extended streaming history export from Spotify. */
export const ExportInstructions = () => (
  <ol style={{ margin: 0, paddingLeft: 20 }}>
    <li>
      <Typography.Text type="secondary">
        Open your Spotify{' '}
        <Typography.Link href={PRIVACY_URL} target="_blank" rel="noreferrer">
          account privacy page
        </Typography.Link>{' '}
        and scroll to &quot;Download your data&quot;.
      </Typography.Text>
    </li>
    <li>
      <Typography.Text type="secondary">
        Tick <Typography.Text strong>Extended streaming history</Typography.Text> (not just
        &quot;Account data&quot;) and request the data.
      </Typography.Text>
    </li>
    <li>
      <Typography.Text type="secondary">
        Confirm the email Spotify sends. The export can take up to 30 days; when it&apos;s ready
        you&apos;ll get a link to download <Typography.Text code>my_spotify_data.zip</Typography.Text>.
      </Typography.Text>
    </li>
  </ol>
);
