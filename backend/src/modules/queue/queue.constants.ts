export const IMAGE_QUEUE = 'image-processing';

export const RESIZE_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: true,
  removeOnFail: 100,
};