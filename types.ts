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
    name: string;
    title: string;
    media: () => MediaObject | null;
    upvote_ratio: number;
    subreddit_name_prefixed: string;
}

export type RedditChild = {
    data: RedditPostChild
}

export type SubRedditListing = {
    data: {
        children: RedditChild[];
    }
}
