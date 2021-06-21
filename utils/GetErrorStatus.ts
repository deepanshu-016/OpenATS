/**
 * Tries to find a `status` inside an error object
 * @param error - An error object from a try/catch block
 * @returns - A status, if found. Defaults to 500
 */
const GetStatus = (error: any) => {
  const defaultStatus = 500;
  const status =
    error?.status || error?.$metadata?.httpStatusCode || defaultStatus;

  return status;
};

export { GetStatus as default };
