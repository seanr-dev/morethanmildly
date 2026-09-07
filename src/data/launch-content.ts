import type { ArticleImage, Category, ContentBlock } from '../lib/types';
const category = (
  n: number,
  name: string,
  description: string,
  type: 'primary' | 'secondary' = 'primary',
): Category => ({
  id: `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  name,
  slug: name.toLowerCase().replaceAll(' ', '-'),
  description,
  type,
  position: n,
});
export const launchCategories = [
  category(
    1,
    'Curious',
    'Good questions, unexpected connections, and the pleasure of looking a little closer.',
  ),
  category(
    2,
    'Obsessed',
    'For the interests that become little worlds of their own. Go on, get into it.',
  ),
  category(
    3,
    'Living',
    'A thoughtful look at the everyday. Small pleasures, useful ideas, and room to breathe.',
  ),
  category(
    4,
    'Culture',
    'The things we make, share, watch, and return to. A closer look at life together.',
  ),
  category(
    5,
    'Future',
    'Ideas for what comes next, and questions about the kind of world we want to build.',
  ),
  category(
    6,
    'Opinionated',
    'A point of view, with room for another. Considered perspectives on modern life.',
  ),
  category(
    7,
    'Humorous',
    'A lighter look at the wonderfully ridiculous business of being a person.',
  ),
  category(
    8,
    'Amazing',
    'Ordinary wonder and extraordinary perspectives. Things worth pausing for.',
  ),
  category(
    9,
    'Mild Takes',
    'A little opinion. A little perspective. Something to turn over in your mind.',
    'secondary',
  ),
  category(
    10,
    'Rabbit Holes',
    'One interesting thought leads to another. Follow the thread.',
    'secondary',
  ),
  category(
    11,
    'Worth It',
    'Small things that deserve a little more of your time and attention.',
    'secondary',
  ),
];
const images: Record<string, ArticleImage> = {
  street: {
    url: '/images/street-piccadilly.jpg',
    alt: 'Pedestrians cross a London street lined with tall stone buildings.',
    credit: 'Vraj Patel / Unsplash',
    source:
      'https://unsplash.com/photos/pedestrians-cross-a-bustling-black-and-white-city-street-u1lrBPJdwdg',
  },
  books: {
    url: '/images/reading-table.jpg',
    alt: 'Stacks of books on a wooden table beside a sunlit window.',
    credit: 'Declan Sun / Unsplash',
    source:
      'https://unsplash.com/photos/books-on-a-table-near-a-window-with-sunlight-fOqCBP_o11s',
  },
  mountains: {
    url: '/images/mountain-layers.jpg',
    alt: 'Layered rocky mountain peaks fade into the haze beneath a pale sky.',
    credit: 'Tobias Rademacher / Unsplash',
    source:
      'https://unsplash.com/photos/black-and-white-mountains-under-white-sky-during-daytime-NuBvAE6VfSM',
  },
};
type Seed = {
  title: string;
  slug: string;
  excerpt: string;
  primary: number;
  secondary: number | null;
  image: string;
  body: ContentBlock[];
};
const p = (text: string): ContentBlock => ({ type: 'paragraph', text });
const h = (text: string): ContentBlock => ({ type: 'heading', text });
const quote = (text: string): ContentBlock => ({ type: 'quote', text });
export const launchStories: Seed[] = [
  {
    title: 'The art of paying attention in a distracted world',
    slug: 'the-art-of-paying-attention',
    excerpt:
      'Sometimes the most interesting thing isn’t somewhere else. It’s the thing you’ve walked past a hundred times.',
    primary: 1,
    secondary: 11,
    image: 'street',
    body: [
      p(
        'There is a particular kind of walk that begins when you put your phone away. The route may be exactly the same. The pavement has not improved. Nobody has arranged a revelation on the corner. But without something asking for your attention every few seconds, the familiar has a chance to become interesting again.',
      ),
      p(
        'You notice a window with a plant leaning towards the light. A hand-painted sign. The way a building changes character above the shopfront. These are not life-changing discoveries, which is part of their appeal. They do not need to become anything else.',
      ),
      h('Start smaller than a new routine'),
      p(
        'Paying attention can sound like another task to get right. Set a timer. Keep a journal. Measure the improvement. There is room for all of that, but there is also room for simply choosing one ordinary moment and giving it a little more space.',
      ),
      p(
        'Wait for the kettle without filling the wait. Look out of a window without looking for a photograph. On a familiar route, choose one detail you have never properly noticed. The invitation is modest: stay with something for a few seconds longer than you usually would.',
      ),
      quote(
        'Not every interesting moment needs to become a photograph, a purchase, or a post.',
      ),
      h('Let a thing be a thing'),
      p(
        'There is a temptation to make every small pleasure useful. A walk becomes a step count. A book becomes a reading target. A beautiful room becomes a list of things to buy. None of these is inherently wrong. They can simply crowd out the experience we came for.',
      ),
      p(
        'Perhaps attention is, in part, permission to leave an experience unfinished. You can enjoy a view without identifying every building in it. You can find a conversation interesting without arriving at a lesson. You can have an unremarkable afternoon that still belongs to you.',
      ),
      p(
        'The world does not have to become more spectacular before it deserves a closer look. Sometimes a different pace is enough. Put the phone in your pocket, if you can. Look up. See what has been here all along.',
      ),
    ],
  },
  {
    title: 'Your weekend doesn’t need an itinerary',
    slug: 'a-weekend-without-an-itinerary',
    excerpt:
      'An invitation to leave a little room between the plans. Something good might happen there.',
    primary: 3,
    secondary: 9,
    image: 'mountains',
    body: [
      p(
        'A free weekend can acquire a surprisingly full job description. Rest properly. See everyone. Get outside. Clean something. Have an experience worth remembering. By Saturday morning, the break has become a project.',
      ),
      h('Leave one piece unplanned'),
      p(
        'There is nothing wrong with a plan. A reservation can be the difference between a lovely lunch and an argument beside a closed door. But a plan does not need to occupy every available hour to be useful.',
      ),
      p(
        'Try leaving one part of the day deliberately open. An afternoon, if you have one. An hour, if you do not. Give it no assignment beyond being available. Read a few pages, walk somewhere familiar, or see what you actually feel like doing when the moment arrives.',
      ),
      p(
        'Not every weekend will allow this. Work, care, money, and other people’s needs make their own schedules. An unplanned hour is not a moral achievement. When one does appear, though, it does not have to earn its place by producing a story.',
      ),
      p(
        'Some weekends are memorable because of where you went. Others are good because, for a little while, you did not have to be anywhere at all.',
      ),
    ],
  },
  {
    title: 'In defence of the unfinished reading pile',
    slug: 'in-defence-of-the-reading-pile',
    excerpt:
      'A stack of unread books can be a small collection of possibilities, rather than a list of things you haven’t done.',
    primary: 2,
    secondary: 10,
    image: 'books',
    body: [
      p(
        'The book beside the bed has a bookmark somewhere near the beginning. The book on the table has an ambitious receipt doing the same job. A third book is waiting because it seemed exactly right for a version of you that has not had a free evening yet.',
      ),
      p(
        'It is easy to turn that pile into evidence against yourself. You meant to read more. You bought something you have not used. You are somehow behind in a race nobody officially entered.',
      ),
      h('An invitation, not an obligation'),
      p(
        'An unread book can also be a door you have not opened. Its presence may say something about what interests you: a place, a question, a way of thinking. That interest does not disappear because you chose sleep last night.',
      ),
      p(
        'Of course, shelves and budgets have limits. Borrowing, swapping, and passing books along can make curiosity feel lighter. A book you no longer want to finish does not need to remain as a permanent accusation.',
      ),
      p(
        'Choose the book that suits the person you are today. Read a chapter, or a page. Put it down if it is not the right one. The point of a reading life is not to eliminate every unread book. It is to keep finding reasons to open one.',
      ),
    ],
  },
  {
    title: 'What makes a place feel like your place?',
    slug: 'when-a-place-feels-like-yours',
    excerpt:
      'A familiar corner, a borrowed table, a route you know by heart. Belonging can begin in small ways.',
    primary: 4,
    secondary: null,
    image: 'street',
    body: [
      p(
        'Some places become familiar before we notice we have become attached to them. A corner shop. A library table. The stretch of pavement where the light changes in the late afternoon. We may not own any part of them, but they begin to fit into our sense of a day.',
      ),
      p(
        'A place can acquire meaning through repetition. The same walk in different weather. A seat where you finished a difficult email. A café visited with somebody who is now far away. The physical details become mixed with the things that happened beside them.',
      ),
      h('Ordinary places count'),
      p(
        'We often reserve the language of belonging for homes, hometowns, and great landscapes. It can live in less impressive settings too. A bus stop can be a meeting place. A small park can hold the shape of a childhood. A public room can offer a little privacy in a crowded life.',
      ),
      p(
        'There is no test a place must pass before it matters. It need not be beautiful to a visitor. It need not appear on a map of recommended things to see.',
      ),
      p(
        'Think of somewhere you would miss if it disappeared. What exactly would you miss: the building, the people, the routine, the version of yourself you get to be there? The answer might tell you what makes a place yours.',
      ),
    ],
  },
  {
    title: 'The future we’d actually like to live in',
    slug: 'the-future-we-want-to-live-in',
    excerpt:
      'Beyond the next device and the next big promise, a few questions about what progress should feel like.',
    primary: 5,
    secondary: 9,
    image: 'street',
    body: [
      p(
        'A new piece of technology often arrives with a picture of the future attached. Everything is smoother, faster, more connected. The pictures tend to be very clean. There are rarely any forgotten passwords.',
      ),
      p(
        'It is worth asking a quieter question alongside the excitement: what would make an ordinary day better? An easier way to get somewhere. More control over your own information. Tools that still work when you cannot afford the newest version.',
      ),
      h('What should we keep?'),
      p(
        'A conversation about the future can begin with what we value now. A public space where you do not have to buy anything. An object that can be repaired. A useful service that is understandable without a tutorial. These are preferences, not predictions, but they are a place to start.',
      ),
      p(
        'The next impressive capability does not tell us, by itself, how it should be used. That is a question for the people who build, buy, regulate, and live with it. It deserves more than a product demonstration.',
      ),
      p(
        'Maybe a desirable future is one in which more things are possible and fewer ordinary things feel unnecessarily difficult. It is not a very dramatic slogan. It could still be a worthwhile design brief.',
      ),
    ],
  },
  {
    title: 'Does everything need to be a side hustle?',
    slug: 'let-a-hobby-be-a-hobby',
    excerpt:
      'A small argument for making something simply because you like making it.',
    primary: 6,
    secondary: 9,
    image: 'books',
    body: [
      p(
        'At some point, a compliment about a hobby can turn into a business suggestion. You should sell these. You should start a channel. You should make a course. The intention may be kind, but the conversation has quietly changed subjects.',
      ),
      p(
        'Making something for pleasure and making something for customers are different experiences. Either can be rewarding. The trouble begins when earning money becomes the only convincing explanation for spending time on an interest.',
      ),
      h('The value that doesn’t need an invoice'),
      p(
        'A hobby can be a place to be inexperienced without consequences. You can make an awkward drawing, bake a lopsided cake, or learn three chords very slowly. There is no requirement to package the experience into a service.',
      ),
      p(
        'This is not advice against turning an interest into work. Some people want that, and some need the income. It is an argument for keeping the choice visible. Enjoyment is allowed to remain the reason.',
      ),
      p(
        'The next time somebody shows you something they made, try asking what they enjoyed about making it. There may be a much more interesting conversation waiting there than a discussion about pricing.',
      ),
    ],
  },
  {
    title: 'A very serious guide to doing absolutely nothing',
    slug: 'a-serious-guide-to-doing-nothing',
    excerpt:
      'Please read these instructions carefully before attempting a moment of completely unproductive peace.',
    primary: 7,
    secondary: null,
    image: 'mountains',
    body: [
      p(
        'First, locate a suitable chair. It need not be a special chair. If buying the chair requires comparing seventeen reviews and making a spreadsheet, you have already wandered away from the brief.',
      ),
      h('Preparation is everything. Or possibly nothing.'),
      p(
        'Sit down. Put your phone somewhere that requires a small but discouraging amount of movement to retrieve. Announce to nobody in particular that you are taking five minutes. Do not immediately use the five minutes to organise the next five minutes.',
      ),
      p(
        'A thought will arrive about something you could be doing. This is normal. Thank the thought for its initiative. Explain that there are currently no openings in the department.',
      ),
      p(
        'You may now look out of a window. If there is a cloud, it is acceptable to watch it. You are under no obligation to identify its type, calculate its speed, or turn the experience into a personal growth exercise.',
      ),
      p(
        'Congratulations. You have done very little. There is no certificate. Making one would defeat the purpose.',
      ),
    ],
  },
  {
    title: 'A small manifesto for looking up',
    slug: 'a-small-manifesto-for-looking-up',
    excerpt:
      'The sky does not need a special occasion. Neither does your sense of wonder.',
    primary: 8,
    secondary: 11,
    image: 'mountains',
    body: [
      p(
        'There are days when the sky is merely the space above the weather app. We check what it is supposed to do, dress accordingly, and carry on. Meanwhile, an entire arrangement of light is happening overhead.',
      ),
      p(
        'You do not need an extraordinary sunset to look up. An ordinary pale afternoon has something going on. So does the flat grey kind of day, when every building seems to be waiting for somebody to turn the contrast back on.',
      ),
      h('Wonder without a destination'),
      p(
        'It is easy to imagine wonder as something that requires travel, equipment, or unusually good timing. Sometimes those things help. But there is also the smaller version: noticing the edge of a cloud, the colour between buildings, the way a familiar hill disappears into mist.',
      ),
      p(
        'You can notice without knowing the right names. You can enjoy a view without proving it was remarkable. You can take a moment that nobody else would have chosen and let it be enough.',
      ),
      p(
        'This is the whole manifesto: look up when it is safe to do so. Stay for a few seconds. Carry on, perhaps a little more aware of the world you are moving through.',
      ),
    ],
  },
  {
    title: 'The quiet pleasure of taking the long way home',
    slug: 'the-long-way-home',
    excerpt:
      'A different turn can make a familiar journey feel like time you chose, instead of time you spent.',
    primary: 3,
    secondary: 11,
    image: 'street',
    body: [
      p(
        'The quickest route has an obvious advantage: it gets you there. On a busy day, that may be the only advantage you have time to consider. But on a day with a little room in it, a less efficient route can offer something else.',
      ),
      p(
        'Take a street you usually pass. Walk by the park instead of through the car park. Choose the road with the old buildings because you like looking at them. The reason can be that simple.',
      ),
      h('Time that belongs to the journey'),
      p(
        'A detour does not have to produce a discovery. Sometimes the pleasure is merely in choosing. You are not trying to make the distance disappear. You are allowing yourself to be somewhere between one thing and the next.',
      ),
      p(
        'The long way is not always practical, accessible, or safe, and it is perfectly fine to go straight home. This is an invitation for the days when a different route is available.',
      ),
      p(
        'There may be nothing new around the corner. There may be a tree you have never properly noticed. Either way, you will have taken a few minutes to let the journey be part of the day.',
      ),
    ],
  },
  {
    title: 'The beautiful inconvenience of a paper notebook',
    slug: 'the-beautiful-inconvenience-of-a-notebook',
    excerpt:
      'No search bar, no notifications, and occasionally no idea where you wrote that thing. A love letter to the imperfect page.',
    primary: 2,
    secondary: 11,
    image: 'books',
    body: [
      p(
        'A paper notebook is a device with a remarkable number of missing features. It cannot remind you of anything. It cannot sync. If you leave it on a train, it does not tell you where it is. Its search function is usually you, turning pages and looking increasingly concerned.',
      ),
      p(
        'And yet, the blank page has a particular appeal. A thought can be sideways. A list can become a drawing. A sentence can be crossed out without disappearing entirely.',
      ),
      h('A place for thoughts in progress'),
      p(
        'There is room on paper for an idea that does not yet know what sort of idea it is. It need not be filed correctly. You can circle a word, draw an arrow to another page, or leave a question surrounded by a generous amount of uncertainty.',
      ),
      p(
        'A notebook does not have to be an argument against digital tools. Use whichever is useful. The pleasure here is in having a place where usefulness is not the only available quality.',
      ),
      p(
        'Pick up a notebook you already own. Write the date, if you like. Then write something you would otherwise forget. It need not be wise. It only needs a place to begin.',
      ),
    ],
  },
  {
    title: 'The case for being a beginner again',
    slug: 'the-case-for-being-a-beginner',
    excerpt:
      'There is a particular freedom in trying something you are not yet expected to be good at.',
    primary: 1,
    secondary: 10,
    image: 'books',
    body: [
      p(
        'Being competent is comfortable. You know where things go, what to expect, and how to avoid the obvious mistakes. Starting something new temporarily removes that comfort. Even the vocabulary can feel like a room where everyone knows one another except you.',
      ),
      p(
        'That awkwardness can also be a kind of freedom. When you do not yet know how a thing is supposed to work, you are allowed to ask the plain question. Why this way? What happens if I try that? What am I missing?',
      ),
      h('Make the first attempt small'),
      p(
        'You do not need to announce a new identity before trying a new interest. Cook one unfamiliar dish. Borrow a basic tool. Make a sketch without deciding to become a person who draws. A small beginning leaves room to discover whether you actually enjoy the activity.',
      ),
      p(
        'Being a beginner does not mean ignoring safety or skipping instruction where it matters. It means letting the learning be visible instead of treating uncertainty as something to hide.',
      ),
      p(
        'You may become good at it. You may decide it is not for you. Either way, you will have given yourself permission to meet something without already knowing what happens next.',
      ),
    ],
  },
  {
    title: 'Why we keep returning to the same stories',
    slug: 'the-stories-we-return-to',
    excerpt:
      'Sometimes the comfort of a familiar book or film is knowing that it will meet you somewhere different this time.',
    primary: 4,
    secondary: 10,
    image: 'books',
    body: [
      p(
        'A familiar story does not contain much suspense about its own ending. We know who leaves, who comes back, and which line arrives just before the music changes. Still, we return.',
      ),
      p(
        'One pleasure of revisiting a story is being able to notice things the first encounter hurried past. A small gesture. An awkward silence. A character whose point of view once seemed less interesting than the plot.',
      ),
      h('Same story, different reader'),
      p(
        'The words or scenes may be unchanged, but we bring a different life to them. A detail can become funny, difficult, or suddenly recognisable. A favourite character can lose their appeal. Someone in the background can step forward.',
      ),
      p(
        'There is also no need to make the return profound. Sometimes you choose a familiar film because it is a comfortable way to spend an evening. Surprise is only one of the things a story can offer.',
      ),
      p(
        'If there is a book you have been thinking about reading again, perhaps that thought is reason enough. You already know what happens. You do not yet know what you will notice.',
      ),
    ],
  },
  {
    title: 'A better question than “Is there an app for that?”',
    slug: 'a-better-question-for-technology',
    excerpt:
      'Before adding another tool, it might help to decide what you actually want to make easier.',
    primary: 5,
    secondary: null,
    image: 'street',
    body: [
      p(
        'A small irritation can lead surprisingly quickly to a search for new software. Somewhere, surely, there is an app that will organise this list, simplify this routine, or make this task feel less like itself.',
      ),
      p(
        'Sometimes there is, and it helps. Sometimes the search adds an account, a subscription, and a new place to forget where you put the information.',
      ),
      h('Describe the problem first'),
      p(
        'Before choosing a tool, try explaining what you need in an ordinary sentence. I want to remember three things when I leave the house. I want the people on this project to know what happens next. I want fewer steps between having an idea and saving it.',
      ),
      p(
        'The answer may still be software. It may also be a shared note, a paper list by the door, or an agreement about when to check in. Defining the need gives you something more useful than a collection of impressive features to compare.',
      ),
      p(
        'A good tool earns its place in your day. It should not require you to invent extra work so that you can appreciate how much it does.',
      ),
    ],
  },
  {
    title: 'You’re allowed to have a small opinion',
    slug: 'you-can-have-a-small-opinion',
    excerpt:
      'A preference does not always need a defence, a declaration, or an argument in the comments.',
    primary: 6,
    secondary: 9,
    image: 'mountains',
    body: [
      p(
        'Some opinions concern the way we should live together. Others concern whether a sandwich is better toasted. These categories do not require the same amount of emotional equipment.',
      ),
      p(
        'It can be pleasant to remember that a preference is allowed to remain local. You like a particular kind of weather. You prefer a quiet restaurant. You do not enjoy the film everybody is discussing. None of this needs to become a campaign.',
      ),
      h('Room for “I just like it”'),
      p(
        'Explaining a preference can lead to a lovely conversation. Insisting that everyone share it usually narrows the possibilities. You can say what you enjoy without turning the alternative into a personal failure.',
      ),
      p(
        'There are subjects where evidence, consequences, and accountability matter deeply. Keeping that distinction clear makes it easier to leave the smaller matters a little lighter.',
      ),
      p(
        'Order the thing you like. Let somebody else order theirs. There is probably something more interesting to talk about over lunch.',
      ),
    ],
  },
  {
    title: 'The meeting that could have been a nice walk',
    slug: 'a-meeting-that-could-have-been-a-walk',
    excerpt:
      'An entirely unofficial proposal from the Department of Looking Out of the Window.',
    primary: 7,
    secondary: 9,
    image: 'street',
    body: [
      p(
        'Thank you all for joining. The agenda is attached to the invitation, which was attached to the reminder, which was attached to a conversation that had already reached a fairly satisfactory conclusion.',
      ),
      p(
        'Before we begin, does anyone have an update on the update? Excellent. We will note that the update is being updated and revisit the matter once the revised update has been circulated.',
      ),
      h('A modest proposal'),
      p(
        'Imagine, for a moment, that the calendar invitation had said: take a short walk and think about the one decision we actually need to make. Return with a sentence. A sentence would be enough. There would be no slide for the sentence.',
      ),
      p(
        'Someone would still have a question. Someone would suggest a follow-up. These are natural features of the landscape. But at least everyone would have seen a tree.',
      ),
      p(
        'Please consider this proposal at your convenience. There is no need to schedule a meeting about it. That said, a walk is available.',
      ),
    ],
  },
  {
    title: 'There is a whole world in an ordinary afternoon',
    slug: 'an-ordinary-afternoon',
    excerpt:
      'A reminder that a day does not need a highlight reel to contain something worth keeping.',
    primary: 8,
    secondary: 11,
    image: 'mountains',
    body: [
      p(
        'An afternoon can disappear into the space between more important things. The work is not finished. Dinner has not happened. Nothing memorable seems to be scheduled. It is merely the middle of a day.',
      ),
      p(
        'Look a little closer and it may contain a collection of small, distinct moments. Warm light on a wall. Something funny said in passing. A drink at just the right temperature. An errand completed without incident, which deserves more appreciation than it tends to receive.',
      ),
      h('Keep something small'),
      p(
        'You need not turn these moments into a practice. There is no requirement to count them or write them down. You can simply let one register before moving to the next thing.',
      ),
      p(
        'Some afternoons are difficult, and noticing a pleasant detail does not cancel the difficulty. It can exist beside it. The day is allowed to contain more than one kind of experience.',
      ),
      p(
        'Later, if somebody asks how your day was, you may still say it was ordinary. That does not have to mean there was nothing in it.',
      ),
    ],
  },
];
export const launchArticles = launchStories.map((story, index) => ({
  id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  title: story.title,
  slug: story.slug,
  excerpt: story.excerpt,
  body: story.body,
  headerImage: images[story.image],
  inlineImages: [],
  primaryCategoryId: launchCategories[story.primary - 1].id,
  secondaryCategoryId: story.secondary
    ? launchCategories[story.secondary - 1].id
    : null,
  author: 'More Than Mildly',
  status: 'published' as const,
  publishedAt: new Date(
    Date.UTC(2026, 8, 6, 8, 0) - index * 60_000,
  ).toISOString(),
}));
