// regex to find the obfuscated image tokens in the page source
const tokenPattern = /dTfnT\([^)]{0,28}"([^"]+)"\);/g;

// regex to validate a plausible decoded url
const validUrlPattern = /^[A-Za-z0-9._~:/?#\[\]@!$&\x27()*+,;=%-]*$/;

// scuffed way to find the right offset to decode the tokens with
// the offset is random per page load, but seems to be consistent within one page load
// so we find the most common offset that produces valid urls
// and use that to decode all tokens
function findMostCommonOffset(tokens) {
  if (tokens.length === 0) {
    return 0;
  }

  const offsets = [];

  for (const token of tokens) {
    let offset = 0;

    // guard against infinite loop 
    // all offsets seem to be below 20
    while (offset <= 20) {
      try {
        const url = decodeAtOffset(token, offset);
  

        if (validUrlPattern.test(url))  {
          offsets.push(offset);
          break;
        };
      } catch (_) {}
      offset++;
    }
  }

  return mostCommon(offsets);
}

// decodes a single token with the given offset
function decodeAtOffset(token, offset) {

  // in dTfnT on rco, slices a random size from start of token 
  // ex: function dTfnT(x,y,z,d,u,sfree, t, z) { sfree.push(z.substr(7, z.length - 7)); }
  token = token.slice(offset);

  // only this replacement actually matters for decoding
  // this marker rotates, hopefully this catchall regex works
  token = token.replace(/[A-Za-z0-9]{2}__[A-Za-z0-9]{6}_/g, 'g');

  // the actual decoding is in baeu function in /Scripts/rguard.min.js
  
  // cut off token at =s0? or =s1600?
  token = token.substring(0, token.search(/=s\d+\?/));

  // takes substring from 15 to 33 and appends from 50 to end
  token = token.substring(15, 33) + token.substring(50);

  // removes 11 chars from end and appends the last two chars
  token = token.substring(0, token.length - 11) + token.slice(-2);

  // base64 decode
  token = decodeURIComponent(encodeURIComponent(atob(token)));

  // remove chars between index 13 and 17
  token = token.substring(0, 13) + token.substring(17);

  // remove last 2 chars
  token = token.slice(0, -2)   

  // The =s0 is a param that specifies image size. if we put s0, it will return the original size
  return "https://2.bp.blogspot.com/" + token + "=s0" ;
}

function atob(input) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = String(input).replace(/=+$/, '');
    if (str.length % 4 === 1) {
        throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    let output = '';
    for (let bc = 0, bs, buffer, i = 0; (buffer = str.charAt(i++)); ~buffer &&
        (bs = bc % 4 ? bs * 64 + buffer : buffer,
        bc++ % 4) ? (output += String.fromCharCode(255 & bs >> (-2 * bc & 6))) : 0) {
        buffer = chars.indexOf(buffer);
    }
    return output;
}

function mostCommon(arr) {
  const counts = new Map();
  let maxCount = 0;
  let mostCommonValue;

  for (const item of arr) {
    const count = (counts.get(item) || 0) + 1;
    counts.set(item, count);

    if (count > maxCount) {
      maxCount = count;
      mostCommonValue = item;
    }
  }

  return mostCommonValue;
}


const tokens = [..._encryptedString.matchAll(tokenPattern)].map(m => m[1]) || [];

let pageLinks;
if (tokens.every(t => t.includes("https"))) {
  pageLinks = tokens.map(token => token.slice(token.indexOf("https"))); 

} else {
  const offset = findMostCommonOffset(tokens);
  
  pageLinks = tokens.map(token => decodeAtOffset(token, offset));
  if (tokens.every(token => token.includes("ip=0"))) {
    pageLinks = pageLinks.map(url => url.replace("https://2.bp.blogspot.com", "https://ano1.rconet.biz/pic"));
  }
}

JSON.stringify(pageLinks);



// document.body.querySelectorAll("script").forEach(script => {
// 	/** @type {string[]}  */ 
//   const tokens = [...script.innerHTML.matchAll(tokenPattern)].map(m => m[1]) || [];
//   const offset = findMostCommonOffset(tokens);
//   console.log(tokens, offset)
//   console.log("Decoded urls:", JSON.stringify(tokens.map(token => decodeAtOffset(token, offset))));
  
// })
