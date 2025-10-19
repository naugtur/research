This is an exploration in what sort of traces are left in node_modules and lockfiles from installing packages in various ways. It should help establish means to tell package names that can be trusted from the ones that can't.

Plan:
- set up a list of packages to install from various sources
- create one shared package.json
- create folders for each pkg manager 
- run a bash script to copy the shared package.json to each folder
- install the packages in each folder with the pkgmanager's default behavior


## experiment
