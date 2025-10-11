import { Metadata } from 'next';

import { MessagesView } from './_components/MessagesView';

export const metadata: Metadata = {
  title: 'Messages',
};

export default function MessagesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
      <header>
        <p className="text-sm font-medium uppercase text-muted-foreground">
          Communications
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Keep tabs on every conversation with manufacturers and buyer teams.
          All of your messages stay synced in real-time through Supabase
          Realtime.
        </p>
      </header>
      <MessagesView />
    </div>
  );
}
