export const addressLikeUsername = username => {
  const length = username.length;
  const firstIsZero = username[0] === "0";
  const secondIsX = username[1].toLowerCase() === "x";
  let isAddress = false;
  if (length > 12 && firstIsZero && secondIsX) {
    username.slice(2, 7).split("").forEach(letter => {
      const code = letter.charCodeAt();
      if ((code >= 48 && code <= 57) || (code >= 97 && code <= 102)) return isAddress = true;
      isAddress = false;
    })
  }
  return isAddress;
}
