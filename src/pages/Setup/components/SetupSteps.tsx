import { Typography } from 'antd';
import type { ReactNode } from 'react';

const DASHBOARD_URL = 'https://developer.spotify.com/dashboard';

const Step = ({ n, children }: { n: number; children: ReactNode }) => (
  <li style={{ marginBottom: 8 }}>
    <Typography.Text type="secondary">
      <Typography.Text strong>{n}.</Typography.Text> {children}
    </Typography.Text>
  </li>
);

/** "How to get your client ID" - ported from Spotify Knockout's connect screen. */
export const SetupSteps = ({ redirectUri }: { redirectUri: string }) => (
  <div>
    <Typography.Text strong>How to get your client ID</Typography.Text>
    <ol style={{ listStyle: 'none', padding: 0, margin: '10px 0 0' }}>
      <Step n={1}>
        Sign in to the Spotify developer dashboard:{' '}
        <Typography.Link href={DASHBOARD_URL} target="_blank" rel="noreferrer">
          developer.spotify.com/dashboard
        </Typography.Link>
      </Step>
      <Step n={2}>
        Click &quot;Create app&quot; and give it any name and description. Already made one for
        Spotify Knockout? You can reuse it - just add the redirect URI below as well.
      </Step>
      <Step n={3}>Add this redirect URI exactly as shown below, then click &quot;Add&quot;.</Step>
      <li style={{ margin: '0 0 8px 16px' }}>
        <Typography.Text code copyable>
          {redirectUri}
        </Typography.Text>
      </li>
      <Step n={4}>
        Tick the &quot;Web API&quot; and &quot;Web Playback SDK&quot; APIs, agree to the terms and
        save.
      </Step>
      <Step n={5}>
        Open the app, go to &quot;Settings&quot; and copy the Client ID into the box above. Leave
        the client secret alone - it is never needed.
      </Step>
      <Step n={6}>
        In &quot;Settings → User Management&quot;, add the Spotify account email of anyone who
        will use the app (including your own). Development-mode apps allow up to 5 users, and
        playback control needs Spotify Premium.
      </Step>
    </ol>
  </div>
);
