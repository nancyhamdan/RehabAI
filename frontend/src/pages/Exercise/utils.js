export function csvToJSON(csv) {
  var lines = csv.split("\n");
  var result = [];
  var headers;

  headers = lines[0].split(",");

  
  // Original references have left and right swapped, so we swap them back here
  // Swap header names for "left_" and "right_"
  for (let j = 0; j < headers.length; j++) {
    if (headers[j].startsWith("left_")) {
      headers[j] = headers[j].replace("left_", "right_");
    } else if (headers[j].startsWith("right_")) {
      headers[j] = headers[j].replace("right_", "left_");
    }
  }

  for (var i = 1; i < lines.length; i++) {
    // Initialize an empty object to hold the current row
    var obj = {};

    if (lines[i] == undefined || lines[i].trim() == "") {
      continue;
    }

    // Split the line into words
    var words = lines[i].split(",");
    // Loop over the words and add them to the object using the corresponding headers as keys
    for (let j = 0; j < words.length; j++) {
      obj[headers[j].trim()] = Number(words[j]);
    }

    result.push(obj);
  }

  return result;
}
