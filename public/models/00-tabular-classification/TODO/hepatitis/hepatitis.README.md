Test Costs for the hepatitis Data
---------------------------------

Peter Turney
June 7, 1995


There are four files, in a C4.5-like format, that contain information
related to cost:

	1. hepatitis.cost
	2. hepatitis.delay
	3. hepatitis.expense
	4. hepatitis.group

For more information on the use and meaning of these files, see:

http://www.cs.washington.edu/research/jair/volume2/turney95a-html/title.html

The remainder of this file describes the format of the above four
files.


hepatitis.cost
--------------

Each row has the format "<test>: <cost>". The cost is in Canadian
dollars. The cost information is from the Ontario Health Insurance
Program's fee schedule. The costs in this file are for individual
tests, considered in isolation.  When tests are performed in groups,
there may be discounts, due to shared common costs. Groups of tests
with common costs are identified in the file "hepatitis.group". Costs
with discounts are in the file "hepatitis.expense".


hepatitis.delay
---------------

Each row has the format "<test>: <immediate/delayed>". Tests with
immediate results are marked "immediate". Tests with delayed results
are marked "delayed". Delayed tests are typically blood tests, which
are usually shipped to a laboratory. The results are sent back to the
doctor the next day.


hepatitis.expense
-----------------

Each row has the format "<test>: <full cost>, <discount cost>".  The
full cost is charged when the given test is the first test of its group
that has been ordered for a given patient. The discount cost is charged
when the given test is the second or later test of its group that has
been ordered. Typically the difference between the full cost and the
discount cost is $2.10, which is the common (shared) cost of collecting
blood from the patient.


hepatitis.group
---------------

The first row lists the groups. The remaining rows have the format
"<test>: <group>". The symbols used for groups are arbitrary. The
information in this file is meant to be used together with the
information in "hepatitis.expense".  The tests in a group share a
common cost.



