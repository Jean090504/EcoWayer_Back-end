export type ResponseEnvelope<T> = {
  success: boolean;
  data: T | null;
  message: string;
  timestamp: string;
};

export const formatResponse = <T>(success: boolean, data: T | null, message: string): ResponseEnvelope<T> => ({
  success,
  data,
  message,
  timestamp: new Date().toISOString(),
});
