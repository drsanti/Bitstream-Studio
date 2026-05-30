import React, { useState } from 'react';
import {
  Globe,
  Monitor,
  Link,
  CheckCircle2,
  XCircle,
  Settings,
  Activity,
  X,
} from 'lucide-react';
import { Card } from '../Card';
import { GlobalConfig } from '../../../../GlobalConfig';

interface InfoItem {
  label: string;
  value: string | boolean | undefined;
  description?: string;
}

// Helper to safely get window properties using bracket notation
const getWindowProp = (key: string): string | boolean | undefined => {
  if (typeof window === 'undefined') return undefined;
  return (window as any)[key] as string | boolean | undefined;
};

// Detect if running in webview vs browser
const isWebviewEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const webviewReady = getWindowProp('WEBVIEW_READY');
  if (webviewReady === true) return true;
  if (typeof window.location !== 'undefined') {
    return window.location.origin.startsWith('vscode-webview://');
  }
  return false;
};

// Helper to get configuration values for both environments
const getConfigValue = (key: string): string | boolean | undefined => {
  const isWebview = isWebviewEnvironment();
  const webviewValue = getWindowProp(key);

  if (isWebview && webviewValue !== undefined) {
    return webviewValue;
  }

  switch (key) {
    case 'WEBVIEW_READY':
      return false;
    case 'WEBVIEW_BASE_URI':
      return typeof window !== 'undefined' && window.location
        ? window.location.origin
        : '';
    case 'LOCAL_ASSETS_BASE_URI':
      return '/assets';
    case 'ONLINE_ASSETS_BASE_URI':
      return GlobalConfig.ONLINE_ASSETS_BASE_URI;
    case 'COI_SERVICE_WORKER_URI':
      return '/t3d-coi-serviceworker.js';
    case 'JOLT_WORKER_SCRIPT_URI':
      return '/jolt/jolt-physics.multithread.wasm-compat.js';
    case 'JOLT_SINGLE_THREADED_PROD_URI':
      return '/jolt/jolt-physics.wasm-compat.js';
    case 'JOLT_SINGLE_THREADED_DEBUG_URI':
      return '/jolt/jolt-physics.debug.wasm-compat.js';
    case 'JOLT_MULTITHREADED_PROD_URI':
      return '/jolt/jolt-physics.multithread.wasm-compat.js';
    case 'JOLT_MULTITHREADED_DEBUG_URI':
      return '/jolt/jolt-physics.debug.multithread.wasm-compat.js';
    default:
      return webviewValue;
  }
};

// Helper to get environment detection values for both environments
const getEnvValue = (key: string): string | boolean | undefined => {
  const isWebview = isWebviewEnvironment();
  const webviewValue = getWindowProp(key);

  if (isWebview && webviewValue !== undefined) {
    return webviewValue;
  }

  switch (key) {
    case 'IS_WEBVIEW':
      return false;
    case 'CAN_USE_THREADS':
      return (
        globalThis.crossOriginIsolated === true &&
        typeof SharedArrayBuffer !== 'undefined'
      );
    case 'SHARED_ARRAY_BUFFER':
      return typeof SharedArrayBuffer !== 'undefined';
    case 'CROSS_ORIGIN_ISOLATED':
      return globalThis.crossOriginIsolated === true;
    case 'JOLT_URI': {
      const canUseThreads =
        globalThis.crossOriginIsolated === true &&
        typeof SharedArrayBuffer !== 'undefined';
      return canUseThreads
        ? '/jolt/jolt-physics.multithread.wasm-compat.js'
        : '/jolt/jolt-physics.wasm-compat.js';
    }
    default:
      return webviewValue;
  }
};

const formatValue = (value: string | boolean | undefined): string => {
  if (value === undefined) return 'undefined';
  if (typeof value === 'boolean') return value.toString();
  return value;
};

// Helper to format URI relative to a base URI
const formatUriRelativeToBase = (
  uri: string,
  baseUri: string | undefined,
  baseLabel: string
): { display: string; full: string } => {
  if (!baseUri || !uri || typeof uri !== 'string') {
    return { display: uri || '', full: uri || '' };
  }

  const normalizedBase = baseUri.endsWith('/') ? baseUri.slice(0, -1) : baseUri;
  const normalizedUri = uri.endsWith('/') ? uri.slice(0, -1) : uri;

  if (normalizedUri.startsWith(normalizedBase)) {
    const relativePath = normalizedUri.substring(normalizedBase.length);
    const display = relativePath ? `${baseLabel}${relativePath}` : baseLabel;
    return { display, full: uri };
  }

  return { display: uri, full: uri };
};

export const EnvironmentInfoCard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const environmentType = isWebviewEnvironment() ? 'Webview' : 'Browser';
  const webviewBaseUri = getConfigValue('WEBVIEW_BASE_URI') as
    | string
    | undefined;

  const configItems: InfoItem[] = [
    {
      label: 'Environment',
      value: environmentType,
      description: 'Current runtime environment',
    },
    {
      label: 'WEBVIEW_BASE_URI',
      value: webviewBaseUri,
      description: 'Webview base URI for local assets',
    },
    {
      label: 'LOCAL_ASSETS_BASE_URI',
      value: getConfigValue('LOCAL_ASSETS_BASE_URI'),
      description: 'Local assets base URI (out/webview/assets)',
    },
    {
      label: 'ONLINE_ASSETS_BASE_URI',
      value: getConfigValue('ONLINE_ASSETS_BASE_URI'),
      description: 'Online assets base URI for T3D engine (fallback)',
    },
    {
      label: 'COI_SERVICE_WORKER_URI',
      value: getConfigValue('COI_SERVICE_WORKER_URI'),
      description: 'COI service worker URI for multi-threaded Jolt Physics',
    },
    {
      label: 'JOLT_WORKER_SCRIPT_URI',
      value: getConfigValue('JOLT_WORKER_SCRIPT_URI'),
      description: 'Jolt Physics Worker script URI for multithreaded build',
    },
    {
      label: 'JOLT_SINGLE_THREADED_PROD_URI',
      value: getConfigValue('JOLT_SINGLE_THREADED_PROD_URI'),
      description: 'Single-threaded production URI',
    },
    {
      label: 'JOLT_SINGLE_THREADED_DEBUG_URI',
      value: getConfigValue('JOLT_SINGLE_THREADED_DEBUG_URI'),
      description: 'Single-threaded debug URI',
    },
    {
      label: 'JOLT_MULTITHREADED_PROD_URI',
      value: getConfigValue('JOLT_MULTITHREADED_PROD_URI'),
      description: 'Multithreaded production URI',
    },
    {
      label: 'JOLT_MULTITHREADED_DEBUG_URI',
      value: getConfigValue('JOLT_MULTITHREADED_DEBUG_URI'),
      description: 'Multithreaded debug URI',
    },
  ];

  const envItems: InfoItem[] = [
    {
      label: 'IS_WEBVIEW',
      value: getEnvValue('IS_WEBVIEW'),
      description: 'Whether running in VS Code webview',
    },
    {
      label: 'JOLT_URI',
      value: getEnvValue('JOLT_URI'),
      description: 'Selected Jolt Physics URI based on thread capability',
    },
    {
      label: 'CAN_USE_THREADS',
      value: getEnvValue('CAN_USE_THREADS'),
      description:
        'Whether threads can be used (crossOriginIsolated && SharedArrayBuffer)',
    },
    {
      label: 'SHARED_ARRAY_BUFFER',
      value: getEnvValue('SHARED_ARRAY_BUFFER'),
      description: 'Whether SharedArrayBuffer is available',
    },
    {
      label: 'CROSS_ORIGIN_ISOLATED',
      value: getEnvValue('CROSS_ORIGIN_ISOLATED'),
      description: 'Whether cross-origin isolation is enabled',
    },
  ];

  const uriFieldsToFormat = [
    'LOCAL_ASSETS_BASE_URI',
    'COI_SERVICE_WORKER_URI',
    'JOLT_WORKER_SCRIPT_URI',
    'JOLT_SINGLE_THREADED_PROD_URI',
    'JOLT_SINGLE_THREADED_DEBUG_URI',
    'JOLT_MULTITHREADED_PROD_URI',
    'JOLT_MULTITHREADED_DEBUG_URI',
  ];
  const envUriFieldsToFormat = ['JOLT_URI'];

  const renderInfoItem = (item: InfoItem) => {
    const isEnvironment = item.label === 'Environment';
    const envValue = item.value === 'Webview' || item.value === 'Browser';

    const shouldFormatUri =
      typeof item.value === 'string' &&
      item.value &&
      !isEnvironment &&
      (uriFieldsToFormat.includes(item.label) ||
        envUriFieldsToFormat.includes(item.label));

    let uriDisplay: { display: string; full: string } | null = null;
    if (
      shouldFormatUri &&
      webviewBaseUri &&
      typeof item.value === 'string' &&
      item.value
    ) {
      uriDisplay = formatUriRelativeToBase(
        item.value,
        webviewBaseUri,
        'WEBVIEW_BASE_URI'
      );
    }

    const isBoolean = typeof item.value === 'boolean';

    return (
      <div
        key={item.label}
        className="py-3 border-b border-border/30 last:border-b-0 space-y-2"
      >
        {/* Row 1: Title */}
        <div>
          <span className="text-sm font-mono font-semibold text-foreground">
            {item.label}
          </span>
        </div>

        {/* Row 2: Description */}
        {item.description && (
          <div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        )}

        {/* Row 3: Value */}
        <div>
          {isBoolean ? (
            <div className="flex items-center gap-2">
              {item.value ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  item.value ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {item.value ? 'Yes' : 'No'}
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isEnvironment && (
                  <>
                    {item.value === 'Webview' ? (
                      <Monitor className="w-4 h-4 text-green-400" />
                    ) : (
                      <Globe className="w-4 h-4 text-blue-400" />
                    )}
                  </>
                )}
                {shouldFormatUri && (
                  <Link className="w-4 h-4 text-muted-foreground/60" />
                )}
                <span
                  className={`text-sm font-mono break-all ${
                    isEnvironment && envValue
                      ? item.value === 'Webview'
                        ? 'text-green-400'
                        : 'text-blue-400'
                      : 'text-foreground'
                  }`}
                >
                  {uriDisplay
                    ? formatValue(uriDisplay.display)
                    : formatValue(item.value)}
                </span>
              </div>
              {uriDisplay && uriDisplay.display !== uriDisplay.full && (
                <div className="text-xs text-muted-foreground/60 font-mono break-all pl-6">
                  Full: {uriDisplay.full}
                </div>
              )}
              {typeof item.value === 'string' &&
                item.value &&
                !isEnvironment &&
                !shouldFormatUri && (
                  <div className="text-xs text-muted-foreground/70 font-mono break-all">
                    {item.value}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed top-4 left-4 z-50 max-w-2xl max-h-[90vh] overflow-y-auto">
      <Card
        title="Environment Configuration"
        className="bg-card/95 backdrop-blur-sm"
        footer={
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => setIsVisible(false)}
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        }
      >
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-border">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Configuration Values
              </h3>
            </div>
            <div>{configItems.map(renderInfoItem)}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-border">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Environment Detection
              </h3>
            </div>
            <div>{envItems.map(renderInfoItem)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
