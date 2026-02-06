export type SubRedditParams = {
  subreddit: string;
};

export type MediaObject = {
  type: string;
  url: string;
  width: number;
  height: number;
};

export type RedditPostChild = {
    title: string;
    media: () => MediaObject | null;
    upvote_ratio: number;
}

export type RedditChild = {
    data: RedditPostChild
}

export type SubRedditListing = {
    data: {
        children: RedditChild[];
    }
}
