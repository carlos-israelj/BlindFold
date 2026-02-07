'use client';

import { MessageBubbleProps } from '@/types';
import VerificationBadge from './VerificationBadge';

export default function MessageBubble({ message, isUser }: MessageBubbleProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-3xl rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 border border-gray-200'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>

        {!isUser && message.verification && (
          <div className="mt-2">
            <VerificationBadge verification={message.verification} />
          </div>
        )}

        <div className={`text-xs mt-2 ${isUser ? 'text-blue-200' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
