/**
 * Logs (console.error) with the given properties.
 * @param error - Error object in the try catch
 * @param method - API method that was called (GET, PUT, POST, etc.)
 * @param query - Query of the request, if any
 * @param body - Body of the request, if any
 */
export const ErrorLogger = (
  error: any,
  method: string,
  query: { [key: string]: string | string[] },
  body: {}
) => {
  const logObject = {
    error: error,
    errorStatus: error?.status,
    errorMessage: error?.message,
    errorRequestId: error?.$metadata?.requestId,
    method: method,
    query: query,
    body: body,
  };

  console.error(logObject);
};
