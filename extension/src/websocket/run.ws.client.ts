import { T3DWebSocketClient } from './T3DWebSocketClient';
import { T3D_DEFAULT_WS_CLIENT_URL } from './T3DWebSocketConfig';

const DEFAULT_URL = T3D_DEFAULT_WS_CLIENT_URL;

/**
 * Example 1: Basic connection and subscription
 * Demonstrates auto-connect, subscribing to a topic, publishing, and receiving messages
 */
export async function example1Basic(): Promise<void> {
  console.log('\n=== Example 1: Basic Connection and Subscription ===\n');

  const client = new T3DWebSocketClient(
    { url: DEFAULT_URL, autoConnect: true },
    {
      onConnect: () => console.log('✅ Connected to server'),
      onDisconnect: () => console.log('❌ Disconnected from server'),
      onMessage: (topic, payload) => {
        console.log(`📨 Message on ${topic}:`, payload);
      },
    }
  );

  try {
    // Wait for connection
    await new Promise((resolve) => {
      if (client.isConnected()) {
        resolve(undefined);
      } else {
        client.once('connect', () => resolve(undefined));
      }
    });

    // Subscribe to a topic
    await client.subscribe('sensor/temperature', 0, 'json');
    console.log('✅ Subscribed to sensor/temperature');

    // Publish a message (will be received via subscription)
    console.log('📤 Publishing message...');
    await client.publish('sensor/temperature', { value: 25.5, unit: 'C', timestamp: Date.now() }, 0);

    // Wait a bit to receive messages
    await new Promise((r) => setTimeout(r, 2000));
  } finally {
    await client.disconnect();
    console.log('✅ Disconnected');
  }
}

/**
 * Example 2: Publishing messages with QoS levels
 * Demonstrates publishing JSON messages with different QoS levels and receiving them
 */
export async function example2Publish(): Promise<void> {
  console.log('\n=== Example 2: Publishing Messages with QoS Levels ===\n');

  const client = new T3DWebSocketClient(
    { url: DEFAULT_URL, autoConnect: true },
    {
      onMessage: (topic, payload, qos) => {
        console.log(`📨 Received on ${topic} (QoS ${qos}):`, payload);
      },
    }
  );

  try {
    await new Promise((resolve) => {
      if (client.isConnected()) {
        resolve(undefined);
      } else {
        client.once('connect', () => resolve(undefined));
      }
    });

    // Subscribe to topics first to receive published messages
    await client.subscribe('sensor/temperature', 0, 'json');
    await client.subscribe('sensor/humidity', 1, 'json');
    await client.subscribe('sensor/pressure', 2, 'json');
    console.log('✅ Subscribed to sensor topics\n');

    // Publish messages with different QoS levels
    console.log('📤 Publishing with QoS 0...');
    await client.publish('sensor/temperature', { value: 25.5, unit: 'C' }, 0);

    console.log('📤 Publishing with QoS 1...');
    await client.publish('sensor/humidity', { value: 60, unit: '%' }, 1);

    console.log('📤 Publishing with QoS 2...');
    await client.publish('sensor/pressure', { value: 1013.25, unit: 'hPa' }, 2);

    await new Promise((r) => setTimeout(r, 2000));
  } finally {
    await client.disconnect();
  }
}

/**
 * Example 3: Binary channel
 * Demonstrates publishing and receiving binary data
 */
export async function example3Binary(): Promise<void> {
  console.log('\n=== Example 3: Binary Channel ===\n');

  const client = new T3DWebSocketClient(
    { url: DEFAULT_URL, autoConnect: true },
    {
      onConnect: () => console.log('✅ Connected'),
      onBinary: (topic, data, qos) => {
        // Convert Uint8Array to hex string for display (cross-platform)
        const hex = Array.from(data.slice(0, 20))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        console.log(`📦 Binary on ${topic} (QoS ${qos}, ${data.length} bytes):`, hex + '...');
      },
    }
  );

  try {
    await new Promise((resolve) => {
      if (client.isConnected()) {
        resolve(undefined);
      } else {
        client.once('connect', () => resolve(undefined));
      }
    });

    // Subscribe to binary channel
    await client.subscribe('stream/video', 0, 'binary');
    console.log('✅ Subscribed to binary channel: stream/video');

    // Publish binary data (using TextEncoder for cross-platform compatibility)
    const binaryData = new TextEncoder().encode('Hello Binary World!');
    console.log('📤 Publishing binary data...');
    await client.publishBinary('stream/video', binaryData, 0);

    await new Promise((r) => setTimeout(r, 2000));
  } finally {
    await client.disconnect();
  }
}

/**
 * Example 4: Wildcard subscriptions
 * Demonstrates MQTT-style wildcard topic subscriptions
 */
export async function example4Wildcards(): Promise<void> {
  console.log('\n=== Example 4: Wildcard Subscriptions ===\n');

  const client = new T3DWebSocketClient(
    { url: DEFAULT_URL, autoConnect: true },
    {
      onMessage: (topic, payload) => {
        console.log(`📨 ${topic}:`, payload);
      },
    }
  );

  try {
    await new Promise((resolve) => {
      if (client.isConnected()) {
        resolve(undefined);
      } else {
        client.once('connect', () => resolve(undefined));
      }
    });

    // Subscribe with wildcards
    await client.subscribe('sensor/+', 0, 'json'); // Single-level wildcard
    console.log('✅ Subscribed to sensor/+ (matches sensor/temperature, sensor/humidity, etc.)');

    await client.subscribe('device/#', 0, 'json'); // Multi-level wildcard
    console.log('✅ Subscribed to device/# (matches device/room1/temp, device/room2/humidity, etc.)');

    // Publish to various topics
    await client.publish('sensor/temperature', { value: 25 }, 0);
    await client.publish('sensor/humidity', { value: 60 }, 0);
    await client.publish('device/room1/temp', { value: 22 }, 0);
    await client.publish('device/room2/humidity', { value: 55 }, 0);

    await new Promise((r) => setTimeout(r, 2000));
  } finally {
    await client.disconnect();
  }
}

/**
 * Example 5: Multiple subscriptions
 * Demonstrates subscribing to multiple topics and managing subscriptions
 */
export async function example5MultipleSubscriptions(): Promise<void> {
  console.log('\n=== Example 5: Multiple Subscriptions ===\n');

  const client = new T3DWebSocketClient(
    { url: DEFAULT_URL, autoConnect: true },
    {
      onMessage: (topic, payload) => {
        console.log(`📨 [${topic}]:`, payload);
      },
    }
  );

  try {
    await new Promise((resolve) => {
      if (client.isConnected()) {
        resolve(undefined);
      } else {
        client.once('connect', () => resolve(undefined));
      }
    });

    // Subscribe to multiple topics
    const topics = [
      { topic: 'sensor/temperature', qos: 0 as const },
      { topic: 'sensor/humidity', qos: 1 as const },
      { topic: 'sensor/pressure', qos: 2 as const },
    ];

    for (const { topic, qos } of topics) {
      await client.subscribe(topic, qos, 'json');
      console.log(`✅ Subscribed to ${topic} (QoS ${qos})`);
    }

    // List all subscriptions
    const subscriptions = client.getSubscriptions();
    console.log(`\n📋 Active subscriptions (${subscriptions.length}):`);
    subscriptions.forEach((sub) => {
      console.log(`  - ${sub.topic} (QoS ${sub.qos}, ${sub.channel})`);
    });

    // Publish to subscribed topics
    await client.publish('sensor/temperature', { value: 25 }, 0);
    await client.publish('sensor/humidity', { value: 60 }, 1);
    await client.publish('sensor/pressure', { value: 1013 }, 2);

    await new Promise((r) => setTimeout(r, 2000));

    // Unsubscribe from one topic
    await client.unsubscribe('sensor/pressure');
    console.log('\n✅ Unsubscribed from sensor/pressure');

    await new Promise((r) => setTimeout(r, 1000));
  } finally {
    await client.disconnect();
  }
}

/**
 * Example 6: Connection state monitoring
 * Demonstrates monitoring connection state changes and reconnection
 */
export async function example6StateMonitoring(): Promise<void> {
  console.log('\n=== Example 6: Connection State Monitoring ===\n');

  const client = new T3DWebSocketClient(
    {
      url: DEFAULT_URL,
      autoConnect: true,
      reconnectPeriod: 1000,
      maxReconnectAttempts: 5,
    },
    {
      onStateChange: (state) => {
        console.log(`🔄 State changed: ${state}`);
      },
      onConnect: () => console.log('✅ Connected'),
      onDisconnect: () => console.log('❌ Disconnected'),
      onReconnect: (attempt) => console.log(`🔄 Reconnecting (attempt ${attempt})...`),
      onError: (err) => console.error('❌ Error:', err.message),
    }
  );

  try {
    await new Promise((resolve) => {
      if (client.isConnected()) {
        resolve(undefined);
      } else {
        client.once('connect', () => resolve(undefined));
      }
    });

    console.log(`Current state: ${client.getConnectionState()}`);
    console.log(`Is connected: ${client.isConnected()}`);

    await new Promise((r) => setTimeout(r, 3000));
  } finally {
    await client.disconnect();
  }
}

/**
 * Example 7: Manual connection control
 * Demonstrates manual connect/disconnect without auto-connect
 */
export async function example7ManualControl(): Promise<void> {
  console.log('\n=== Example 7: Manual Connection Control ===\n');

  const client = new T3DWebSocketClient(
    { url: DEFAULT_URL, autoConnect: false },
    {
      onConnect: () => console.log('✅ Connected'),
      onDisconnect: () => console.log('❌ Disconnected'),
    }
  );

  try {
    console.log('Initial state:', client.getConnectionState());
    console.log('Is connected:', client.isConnected());

    // Manually connect
    console.log('\n🔌 Connecting...');
    await client.connect();
    console.log('Connected! State:', client.getConnectionState());

    await client.subscribe('test/topic', 0, 'json');
    await client.publish('test/topic', { message: 'Hello' }, 0);

    await new Promise((r) => setTimeout(r, 2000));

    // Manually disconnect
    console.log('\n🔌 Disconnecting...');
    await client.disconnect();
    console.log('Disconnected! State:', client.getConnectionState());
  } catch (err) {
    console.error('Error:', err);
  }
}

/**
 * Example 8: Ping keepalive
 * Demonstrates using ping/pong to keep connection alive
 */
export async function example8Keepalive(): Promise<void> {
  console.log('\n=== Example 8: Ping Keepalive ===\n');

  const client = new T3DWebSocketClient({
    url: DEFAULT_URL,
    autoConnect: true,
    pingInterval: 5000, // Send ping every 5 seconds
  });

  try {
    await new Promise((resolve) => {
      if (client.isConnected()) {
        resolve(undefined);
      } else {
        client.once('connect', () => resolve(undefined));
      }
    });

    console.log('✅ Connected with ping interval: 5000ms');
    console.log('Ping messages will be sent automatically to keep connection alive');

    await new Promise((r) => setTimeout(r, 15000)); // Wait 15 seconds
  } finally {
    await client.disconnect();
  }
}

/**
 * Example 9: Error handling
 * Demonstrates error handling and recovery
 */
export async function example9ErrorHandling(): Promise<void> {
  console.log('\n=== Example 9: Error Handling ===\n');

  const client = new T3DWebSocketClient(
    {
      // Intentionally invalid URL to demonstrate retry + error callbacks
      url: 'ws://invalid-host:9998',
      autoConnect: true,
      maxReconnectAttempts: 3,
    },
    {
      onError: (err) => {
        console.error('❌ Error occurred:', err.message);
      },
      onStateChange: (state) => {
        console.log(`🔄 State: ${state}`);
      },
    }
  );

  try {
    // Wait a bit to see connection attempts
    await new Promise((r) => setTimeout(r, 10000));
  } finally {
    await client.disconnect();
  }
}

/**
 * Example 10: JSON and Binary channels together
 * Demonstrates using both JSON and binary channels simultaneously
 */
export async function example10BothChannels(): Promise<void> {
  console.log('\n=== Example 10: JSON and Binary Channels ===\n');

  const client = new T3DWebSocketClient(
    { url: DEFAULT_URL, autoConnect: true },
    {
      onMessage: (topic, payload) => {
        console.log(`📨 JSON [${topic}]:`, payload);
      },
      onBinary: (topic, data) => {
        console.log(`📦 Binary [${topic}]: ${data.length} bytes`);
      },
    }
  );

  try {
    await new Promise((resolve) => {
      if (client.isConnected()) {
        resolve(undefined);
      } else {
        client.once('connect', () => resolve(undefined));
      }
    });

    // Subscribe to both channels
    await client.subscribe('data/json', 0, 'json');
    await client.subscribe('data/binary', 0, 'binary');
    console.log('✅ Subscribed to both JSON and binary channels');

    // Publish to both (using TextEncoder for cross-platform compatibility)
    await client.publish('data/json', { type: 'sensor', value: 42 }, 0);
    await client.publishBinary('data/binary', new TextEncoder().encode('Binary payload'), 0);

    await new Promise((r) => setTimeout(r, 2000));
  } finally {
    await client.disconnect();
  }
}

// Main function to run examples
async function main(): Promise<void> {
  const example = process.argv[2];

  const examples: Record<string, () => Promise<void>> = {
    ex1: example1Basic,
    ex2: example2Publish,
    ex3: example3Binary,
    ex4: example4Wildcards,
    ex5: example5MultipleSubscriptions,
    ex6: example6StateMonitoring,
    ex7: example7ManualControl,
    ex8: example8Keepalive,
    ex9: example9ErrorHandling,
    ex10: example10BothChannels,
  };

  if (example && examples[example]) {
    await examples[example]();
  } else {
    console.log('Usage: tsx src/websocket/run.ws.client.ts <example>\n');
    console.log('Examples:');
    console.log('  ex1  - Basic connection and subscription');
    console.log('  ex2  - Publishing messages');
    console.log('  ex3  - Binary channel');
    console.log('  ex4  - Wildcard subscriptions');
    console.log('  ex5  - Multiple subscriptions');
    console.log('  ex6  - Connection state monitoring');
    console.log('  ex7  - Manual connection control');
    console.log('  ex8  - Ping keepalive');
    console.log('  ex9  - Error handling');
    console.log('  ex10 - JSON and binary channels together');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
