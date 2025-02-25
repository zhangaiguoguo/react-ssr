export function delay(timer: number = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, timer);
  });
}
