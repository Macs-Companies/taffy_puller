INSTALLATION
============

*STEP 1*

Download and install LTS version of Node.js from https://nodejs.org

*STEP 2*

Download and install Github Desktop from https://desktop.github.com/

*STEP 3*

Clone `BoDaly/taffy_puller` to your Desktop

*STEP 4*

Create a .env file in the base folder of `taffy_puller` and add line `USERNAME={macUserName}` replacing `{macUserName}` with your mac user name.

*STEP 5*

Open terminal and navigate to the taffy_puller folder

`cd /Users/USERNAME/Desktop/taffy_puller` replacing USERNAME with your mac user name

*STEP 6*

In terminal
`npm install`


RUN TAFFY_PULLER
=================

In terminal while navigated to the taffy_puller folder on your desktop
`node taffy_puller.js SCHEDULE_DATE SCHEDULE_TYPE ORDER_NUMBER`

*SCHEDULE_DATE*
---------------
This is the date that the order is scheduled in any date format
`MM/dd/yy` is recommended. for Example: `7/12/2021`

*SCHEDULE_TYPE*
---------------
This is the type that is going to be processed. Possible Values are:`STICKER`, `COASTER`, `SIGNS`, `SOCK`

- At this time `SHIRTS` will need to be done manually

*ORDER NUMBER*
---------------
This is the 6 digit code used by SO to identify the order. For Example: `802125`
