export const catchAsync =
    (fn: any) =>
    (...args: any) => {
        fn(...args).catch((error: any) => {
            console.log(error);
        });
    };
