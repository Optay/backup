/**
 * Backup
 * A simple backup script that copies files based on modification time.
 * Backup uses two operations: copy and clean. Copy scans the SRC paths and copies files
 * that are new or newer to the DEST. Clean scans the DEST paths and deletes files
 * that are not present in SRC.
 *
 * Note that the clean operation deletes from the DEST paths all files not present in the
 * matching SRC paths.
 *
 */

var backup = function() {

var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');

// Define source and destination
var driveSrc = 'C:';
//var pathSrc = ['Important/music']; // test path
var pathSrc = ['Important', 'Users'];
var driveDest = 'Y:';
//

// Initialize log
try {
  var logStream = fs.createWriteStream( path.join( __dirname, 'log.txt') );
} catch (error) {
  console.log( 'Unable to initialize log', error );
  return;
}
//

copySrc();
cleanDest();

// BACKUP
function copySrc() {
  // Begin the walk
  var pathQueue = [];
  
  for(var i=0, len=pathSrc.length; i<len; i++ ) {
    var folderPath = path.join( driveSrc, pathSrc[i] );
    pathQueue.push( folderPath );
    log("Copying folder", folderPath );
  }
  
  while ( pathQueue.length > 0 ) {
    var folderPathSrc = pathQueue.pop();
    
    // Check destination for folder and add it if necessary
    var folderPathBits = folderPathSrc.split( path.sep );
    folderPathBits[0] = driveDest;
    var folderPathDest = folderPathBits.join( path.sep );
    try {
      var test = fs.statSync( folderPathDest );
    } catch(e) {
      log( 'Make directory', folderPathDest );
      try {
        fs.mkdirSync( folderPathDest );
      } catch(error) {
        log('Error making directory', folderPathDest );
        continue; // Skip it, since we won't be able to copy anything.
      }
    }
    //
    
    // Contents of folder
    try {
      var items = fs.readdirSync( folderPathSrc );
    } catch(error) {
      log('Error reading contents of directory', error );
      continue;
    }
    
    
    //if ( err != null ) { log(err); }
    for( var i = 0, len=items.length; i<len; i++ ) {
      var itemPathSrc = path.join( folderPathSrc, items[i] );
      try {
        var statsSrc = fs.lstatSync( itemPathSrc );
      } catch (error) {
        log( "Error getting stats for file", itemPathSrc, error );
        continue; // Move on
      }
      
      if ( statsSrc.isFile() ) {
        var pathBits = itemPathSrc.split( path.sep );
        pathBits[0] = driveDest;
        var itemPathDest = pathBits.join( path.sep );
        
        // Check destination for file
        var copyFile = false;
        try {
          fs.accessSync(itemPathDest, fs.F_OK);
          
          // Compare times
          try {
            // Check if time difference is greater than 1 second. The fse copy function does
            // not copy milliseconds in timestamp, so differences less than 1 second will persist.
            var statsDest = fs.statSync( itemPathDest );
            var timeDiff = statsSrc.mtime.getTime() - statsDest.mtime.getTime();
            if ( timeDiff > 1000 ) {
              log( 'Source file is newer', statsSrc.mtime.getTime(), statsDest.mtime.getTime() );
              copyFile = true;
            }
          } catch( error) {
            log( 'Error getting item stats', error );
          }
        } catch(e) {
          log( 'File not present in destination', itemPathDest );
          copyFile = true;
        }
        if ( copyFile ) {
          log( 'Copy', itemPathSrc, itemPathDest );
          fse.copy( itemPathSrc,
                    itemPathDest,
                    { clobber: true, preserveTimestamps: true },
                    function( error ) {
            if ( error ) {
              log("Error copying", itemPathSrc, itemPathDest );
            }
          });
        }
        
      } else if ( statsSrc.isDirectory() ) {
        //log( "directory:" + files[iFile] );
        pathQueue.push( itemPathSrc );
      } else {
        // Anything else is a link of some kind which we will ignore.
      }
    }
  }
  log("Copying complete");
}

/**
 * 
 */
function cleanDest() {
  // CLEAN
  // walk the destination
  var pathQueue = [];
  
  for(var i=0, len=pathSrc.length; i<len; i++ ) {
    var folderPathDest = path.join( driveDest, pathSrc[i] );
    pathQueue.push( folderPathDest );
    log("Cleaning folder", folderPathDest );
  }
  
  
  while ( pathQueue.length > 0 ) {
    var folderPathDest = pathQueue.pop();
    
    // Contents of folder
    try {
      var contents = fs.readdirSync( folderPathDest );
    } catch(error) {
      log('Error getting directory contents', error );
    }
    //if ( err != null ) { log(err); }
    for( var i = 0, len=contents.length; i<len; i++ ) {
      var itemPathDest = path.join( folderPathDest, contents[i] );
      
      var pathBits = itemPathDest.split( path.sep );
      pathBits[0] = driveSrc;
      var itemPathSrc = pathBits.join( path.sep );
      
      
      try {
        var statsSrc = fs.lstatSync( itemPathSrc );
      } catch(error) {
        // Item is not present in source, delete it from backup path
        log("Deleting", itemPathDest );
        // DO NOT DELETE ANY "SRC" PATHS
        fs.unlink( itemPathDest, function(error) {
          if (error) {
            log("Error deleting: " + itemPathDest + "\n" + error );
          }
        });
        continue; // We're done with this item
      }
      
      try {
        var statsDest = fs.lstatSync( itemPathDest );
        if ( statsDest.isDirectory() ) {
          pathQueue.push( itemPathDest );
        }
      } catch(error) {
        log( 'Error getting item stats', error );
      }
    }
  }
  log("Clean complete");
}






/**
 * Log a message to the console and write it to the log file.
 */
function log() {
  if ( arguments.length === 0 ) { return; }
  
  var sep = ', ';
  var message = arguments[0];
  for (var i=1; i<arguments.length; i++ ) {
    message += sep + arguments[i];
  }
  
  console.log( message );
  logStream.write( message + '\n' );
}

}

backup();



