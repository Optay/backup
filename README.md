# Backup
A simple backup script that copies files based on modification time. The source/destination drive and paths must be edited in the script. Then run:

    node backup.js

Backup performs two operations: copy and clean. Copy scans the source paths and copies files that are new or newer to the destination. Clean scans the destination paths and deletes files that are not present in source.

Note that the clean operation deletes from the destination paths all files not present in the matching source paths. Set the destination carefully.

##Changelog


