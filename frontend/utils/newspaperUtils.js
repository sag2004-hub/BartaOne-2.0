export const formatNewspaperDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatNewspaperTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTimeRemaining = (expiresAt) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry - now;

  if (diff <= 0) {
    return { expired: true, text: 'Expired' };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    expired: false,
    hours,
    minutes,
    seconds,
    text: `${hours}h ${minutes}m ${seconds}s`,
  };
};

export const isNewspaperExpired = (expiresAt) => {
  const now = new Date();
  return new Date(expiresAt) <= now;
};

export const getPageCount = (pages) => {
  return pages?.length || 0;
};

export const getNewspaperThumbnail = (pages) => {
  if (pages && pages.length > 0 && pages[0].images && pages[0].images.length > 0) {
    return pages[0].images[0];
  }
  return null;
};

export const getFirstPageContent = (pages) => {
  if (pages && pages.length > 0) {
    return pages[0].content;
  }
  return '';
};

export const getLastPageNumber = (pages) => {
  if (pages && pages.length > 0) {
    return pages[pages.length - 1].pageNumber;
  }
  return 0;
};

export const getPageByNumber = (pages, pageNumber) => {
  if (pages) {
    return pages.find((page) => page.pageNumber === pageNumber);
  }
  return null;
};

export const getTotalPages = (pages) => {
  return pages?.length || 0;
};