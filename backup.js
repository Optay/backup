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
 * TODO:
 *  make repo,
 *  commit,
 *  make dev branch...,
 *  add try-catch to all fs calls.
 *  Uncomment file operations, double check file operations never write to SRC paths, do limited test run.
 *  set up for full run
 *  
 */

var fs = require('fs');
//var fse = require('fs-extra');
var path = require('path');

// Define source and destination
var driveSrc = 'C:';
var pathSrc = ['Important/images'];
//var pathSrc = ['Important', 'Users'];
var driveDest = 'Y:';
//

// Initialize log
var logStream = fs.createWriteStream( path.join( __dirname, 'log.txt') );
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
      //fs.mkdirSync( folderPathDest );
    }
    //
    
    // Contents of folder
    var items = fs.readdirSync( folderPathSrc );
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
          var statsDest = fs.statSync( itemPathDest );
          if ( statsSrc.mtime.getTime() > statsDest.mtime.getTime() ) {
            log( 'Source file is newer', statsSrc.mtime.getTime(), statsDest.mtime.getTime() );
            copyFile = true;
          }
        } catch(e) {
          log( 'File not present in destination', itemPathDest );
          copyFile = true;
        }
        if ( copyFile ) {
          log( 'copy', itemPathSrc, itemPathDest );
          /*fse.copy( itemPathSrc,
                      itemPathDest,
                      { clobber: true, preserveTimestamps: true },
                      function( error ) {
            if ( error ) {
              log("Error copying", itemPathSrc, itemPathDest );
            }
          });*/
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
    var contents = fs.readdirSync( folderPathDest );
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
        /*fs.unlink( itemPath, function(error) {
          if (error) {
            log("Error deleting: " + itemPath + "\n" + error );
          }
        });*/
        continue; // We're done with this item
      }
      
      var statsDest = fs.lstatSync( itemPathDest );
      if ( statsDest.isDirectory() ) {
        pathQueue.push( itemPathDest );
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




