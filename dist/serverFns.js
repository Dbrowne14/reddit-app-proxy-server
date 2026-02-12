// to find correct sub params this works for Images too
export const findImg = (sub) => {
    const data = sub.data;
    if (data.icon_img) {
        return data.icon_img;
    }
    if (data.community_icon) {
        const rawUrl = data.community_icon;
        return rawUrl.replace(/&amp;/g, "&");
    }
    return null;
};
//to find correct Media params
export const findMedia = (post) => {
    const data = post.data;
    const crosspostRoot = data.crosspost_parent_list?.[0]?.secure_media;
    const isAd = data.post_hint === "self";
    //rejection conditions
    const isGallery = data.crosspost_parent_list?.[0]?.gallery_data ||
        crosspostRoot?.gallery_data ||
        data.gallery_data;
    const isRemoved = data.removed_by_category !== null ||
        crosspostRoot?.removed_by_category ||
        data.crosspost_parent_list?.[0]?.removed_by_category;
    const isUnpopular = data.upvote_ratio < 0.7;
    const isStickied = data.stickied === true;
    const isVideo = data.secure_media?.reddit_video;
    if (isGallery || isRemoved || isUnpopular || isAd || isStickied || isVideo) {
        return null;
    }
    // is a gif with acceptable format
    if (data.url_overridden_by_dest) {
        return {
            type: "gif",
            url: data.url_overridden_by_dest,
            width: data.preview?.images?.[0]?.source?.width,
            height: data.preview?.images?.[0]?.source?.height,
        };
    }
    //is an image
    if (data.url) {
        return {
            type: "image",
            url: data.url,
            width: data.preview?.images?.[0]?.source?.width,
            height: data.preview?.images?.[0]?.source?.height,
        };
    }
    // or return null
    return null;
};
