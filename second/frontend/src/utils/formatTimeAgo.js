export const formatTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (diff < 60000)       return 'just now';
  if (mins  < 60)         return `${mins}m`;
  if (hours < 24)         return `${hours}h`;
  if (days  < 7)          return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
