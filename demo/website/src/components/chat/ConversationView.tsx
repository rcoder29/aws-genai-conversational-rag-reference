/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
PDX-License-Identifier: Apache-2.0 */
import { Alert, Spinner } from '@cloudscape-design/components';
import { ChatMessage } from 'api-typescript-react-query-hooks';
import { forwardRef, useEffect, useMemo } from 'react';
import { useOnStreamLLMResponse } from 'ws-api-typescript-websocket-hooks';
import Message from './Message';
import { CHAT_MESSAGE_PARAMS, useInprogressMessages, useListChatMessages } from '../../hooks';
import EmptyState from '../Empty';

type ConversationViewProps = {
  chatId: string;
};

export const ConversationView = forwardRef((props: ConversationViewProps, ref: React.ForwardedRef<HTMLDivElement>) => {
  const { chatId } = props;

  const { data, error, fetchNextPage, isFetching, isLoading, hasNextPage, refetch } = useListChatMessages({
    chatId,
    ...CHAT_MESSAGE_PARAMS,
  });

  const inprogressMessages = useInprogressMessages(chatId, refetch);

  console.log('ConversationView-inprogressMessages', inprogressMessages);

  useOnStreamLLMResponse((input) => {
    console.log('onStreamLLMResponse', input);
  }, []);

  const messages = useMemo<ChatMessage[]>(() => {
    const _messages = data?.pages?.flatMap((p) => p.chatMessages || (p as any).data || []) ?? [];
    if (inprogressMessages != null) {
      _messages.push(inprogressMessages.human, inprogressMessages.ai);
    }
    return _messages;
  }, [data, inprogressMessages]);

  // TODO: load next page on scroll in view of last
  // Should we load newest items first?
  // Should we scroll the last message into view always?
  useEffect(() => {
    if (!isFetching && hasNextPage) {
      fetchNextPage().catch(console.error);
    }
  }, [hasNextPage && isFetching]);

  return (
    <>
      {error && <Alert type="error">{(error as Error).message || String(error)}</Alert>}
      <div
        ref={ref}
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          backgroundColor: '#fcfcfc',
          padding: '4px',
          boxSizing: 'border-box',
          overflowY: 'scroll',
        }}
      >
        {messages.length === 0 && !isLoading && <EmptyState title="No messages" subtitle="No messages to display." />}
        {messages.map((message) => (
          <Message
            message={message}
            key={message.messageId}
            humanStyles={{
              backgroundColor: '#ffffff',
            }}
            aiStyles={{
              backgroundColor: '#efefef',
            }}
          />
        ))}
        {(isLoading || isFetching) && (
          <div
            style={{
              display: 'flex',
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Spinner size="big" />
          </div>
        )}
      </div>
    </>
  );
});
