const fs = require('fs');

function getFolderSize(folderPath) {
  let totalSize = 0;

  function calculateSize(path) {
    const stats = fs.statSync(path);

    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const dirContents = fs.readdirSync(path);
      dirContents.forEach((item) => {
        calculateSize(`${path}/${item}`);
      });
    }
  }

  calculateSize(folderPath);
  return totalSize;
}

module.exports = getFolderSize