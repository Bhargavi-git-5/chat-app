import { ME_ID, type ChatSnapshot, type Conversation, type Message, type User } from '../types';

const MIN = 60_000;

// const user = (id: string, name: string, online: boolean): User => ({ id, name, online });

const user = (
  id: string,
  name: string,
  avatar: string,
  online: boolean
): User => ({
  id,
  name,
  avatar,
  online,
});


export const ALL_USERS: User[] = [
  user('me', 'You', 'https://i.pravatar.cc/120?img=12', true),

  user('u1', 'Aisha Khan', 'https://i.pravatar.cc/120?img=47', true),

  user('u2', 'Rohan Mehta', 'https://i.pravatar.cc/120?img=13', false),

  user('u3', 'Sofia Garcia', 'https://i.pravatar.cc/120?img=44', true),

  user('u4', 'Liam Chen', 'https://i.pravatar.cc/120?img=60', true),

  user('u5', 'Priya Nair', 'https://i.pravatar.cc/120?img=49', false),

  user('u6', 'Daniel Okafor', 'https://i.pravatar.cc/120?img=52', true),

  user('u7', 'Emma Wilson', 'https://i.pravatar.cc/120?img=45', true),

  user('u8', 'Noah Brown', 'https://i.pravatar.cc/120?img=14', false),
];

// export const ALL_USERS: User[] = [
//   user(ME_ID, 'You', true),
//   user('u1', 'Aisha Khan', true),
//   user('u2', 'Rohan Mehta', false),
//   user('u3', 'Sofia Garcia', true),
//   user('u4', 'Liam Chen', true),
//   user('u5', 'Priya Nair', false),
//   user('u6', 'Daniel Okafor', true),
//   user('u7', 'Emma Wilson', true),
//   user('u8', 'Noah Brown', false),
// ];

const FILLER = [
  'Pushed the fix to the feature branch.',
  'Can someone review my PR when they get a minute?',
  'Standup notes are in the wiki.',
  'The staging build is green again.',
  'I will pick up the sidebar ticket.',
  'Looks good to me, merging now.',
  'Heads up: design tokens changed in Figma.',
  'Lunch at 1?',
];

/**
 * Builds a fresh dataset relative to "now" so dates (Today / Yesterday) always look right.
 * Called from the service layer only, never from UI components.
 */
export function createMockData(): ChatSnapshot {
  const now = Date.now();
  let n = 0;
  const msg = (
    conversationId: string,
    senderId: string,
    text: string,
    minsAgo: number,
    extra: Partial<Message> = {},
  ): Message => ({
    id: `seed-${++n}`,
    conversationId,
    senderId,
    text,
    createdAt: now - minsAgo * MIN,
    status: 'read',
    reactions: [],
    ...extra,
  });

  const conversations: Conversation[] = [
    { id: 'c1', type: 'direct', name: '', memberIds: [ME_ID, 'u1'], unreadCount: 2 },
    { id: 'c2', type: 'direct', name: '', memberIds: [ME_ID, 'u2'], unreadCount: 0 },
    { id: 'c3', type: 'group', name: 'Frontend Team', memberIds: [ME_ID, 'u1', 'u2', 'u3', 'u4'], unreadCount: 3 },
    { id: 'c4', type: 'direct', name: '', memberIds: [ME_ID, 'u3'], unreadCount: 0 },
    { id: 'c5', type: 'group', name: 'Design Critique', memberIds: [ME_ID, 'u3', 'u5', 'u7'], unreadCount: 1 },
    { id: 'c6', type: 'direct', name: '', memberIds: [ME_ID, 'u5'], unreadCount: 0 },
    { id: 'c7', type: 'group', name: 'Weekend Hike', memberIds: [ME_ID, 'u4', 'u6', 'u8'], unreadCount: 0 },
  ];

  const c3Members = ['u1', 'u2', 'u3', 'u4', ME_ID];
  const c3History: Message[] = Array.from({ length: 90 }, (_, i) =>
    msg('c3', c3Members[i % c3Members.length], FILLER[i % FILLER.length], 3200 - i * 25),
  );

  const messages: Record<string, Message[]> = {
    c1: [
      msg('c1', ME_ID, 'Hey Aisha, did you get a chance to look at the onboarding flow?', 1500),
      msg('c1', 'u1', 'Yes! Left a few comments in Figma.', 1490, { id: 'c1-a' }),
      msg('c1', ME_ID, 'Great, I will address them today.', 1480, { reactions: [{ emoji: '👍', userIds: ['u1'] }] }),
      msg('c1', 'u1', 'Also, can we sync on the API contract tomorrow?', 55, { replyToId: 'c1-a' }),
      msg('c1', 'u1', 'I can do 11am or 3pm.', 54),
    ],
    c2: [
      msg('c2', 'u2', 'Deployment finished without errors 🚀', 300),
      msg('c2', ME_ID, 'Nice work, thanks for staying late on that.', 290),
      msg('c2', 'u2', 'Anytime. Offline tomorrow, back Thursday.', 280),
    ],
    c3: [
      ...c3History,
      msg('c3', 'u3', 'Reminder: we are moving the chat module to Zustand this sprint.', 240, { id: 'c3-a' }),
      msg('c3', ME_ID, 'I will own the store setup and selectors.', 230),
      msg('c3', 'u4', 'I can pair on tests for the reducers.', 200, { reactions: [{ emoji: '🎉', userIds: ['u3', ME_ID] }] }),
      msg('c3', 'u1', 'Do we want virtualisation for long threads?', 20),
      msg('c3', 'u2', 'Optional, but nice to have.', 12, { replyToId: 'c3-a' }),
      msg('c3', 'u3', 'Let us ship the core first.', 4),
    ],
    c4: [
      msg('c4', 'u3', 'Are you joining the design review?', 2900),
      msg('c4', ME_ID, 'Yes, see you there.', 2880),
    ],
    c5: [
      msg('c5', 'u5', 'Uploaded the latest mockups for review.', 180),
      msg('c5', 'u7', 'The spacing in the sidebar feels tight on mobile.', 90),
      msg('c5', 'u3', 'Agreed, I will bump it up by 4px.', 15),
    ],
    c6: [msg('c6', ME_ID, 'Thanks for the feedback, Priya!', 6000, { status: 'delivered' })],
    c7: [
      msg('c7', 'u6', 'Trail is open this Saturday!', 4400),
      msg('c7', 'u4', 'Count me in 🥾', 4390),
      msg('c7', ME_ID, 'Same. I will bring snacks.', 4380),
    ],
  };

  const users = Object.fromEntries(ALL_USERS.map((u) => [u.id, { ...u }]));
  return { users, conversations, messages };
}
