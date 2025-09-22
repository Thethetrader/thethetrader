import { StreamChat } from 'stream-chat';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || 'apk7cmaduwd3';
const apiSecret = process.env.NEXT_PUBLIC_STREAM_SECRET || '5c6jpud3n7h7nv9sjjg926v47q3wspbfajv56n25pddsqkbtszr7t86gygjg34k2';

export const serverClient = StreamChat.getInstance(apiKey, apiSecret);
export const clientStreamChat = StreamChat.getInstance(apiKey);