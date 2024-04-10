const sleep = (time:number) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  };
  
export default sleep;