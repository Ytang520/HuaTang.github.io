---
title: "Researh on Airline Fleet Allocation"
collection: projects
excerpt: 'unfinished'
permalink: /projects/Researh on Airline Fleet Allocation
---

Jun.2022 - Sept.2022: Researh on Airline Fleet Allocation, advised by Prof. [Yaoming Zhou](https://me.sjtu.edu.cn/teacher_directory1/zhouyaoming.html), Associate Professor, Department of Industrial Engineering and Management, Shanghai Jiao Tong University(SJTU).

Code(negative flight deletion) is available at ==unfinished==


## Process:
- The research aimed to help an airline optimize fleet assignment and flight schedules after a merger, in order to maximize profitability and operational efficiency. Historical booking data, fleet information and other constraints were incorporated to develop optimization models. 

- The multinomial logit model was used to analyze passenger choice behavior and understand customer demand across different routes. A spatial-temporal network model was built to assign aircraft types to each flight leg, with the goal of maximizing profit. 

- The optimized fleet assignment plan increased the airline's sales volume by 20.19% and revenue by 14.51% compared to pre-merger levels. Sensitivity analysis showed the model was robust to demand fluctuations. Suggestions were provided to streamline the fleet and enhance flight schedules.

## My Role: Improve the Computed Flight Schedule via Flight Deletion

In this project, my role involves improving the computed flight schedule via flight deletion. I built a directed graph with flights as edges and airports as nodes, using flight profitability as edge weights. My optimization algorithm iteratively detected and eliminated negative cyclic routes to maximize overall profit. The main challenge was improving Dijkstra's algorithm to find the minimum negative cycle in Euler graphs with potential negative weights. My workflow included data preprocessing, negative weight cycle identification, and iterative deletion. This optimization method effectively incorporated domain constraints and objectives, guaranteeing optimal schedule profitability with theoretical proof.

---

**Reflection**

During this process, I went through a repeated cycle of "attempting" and "failing". But when my imperfect yet practical algorithm was presented, the immense sense of satisfaction came to me, which I will never forget. To this day, I am grateful for this experience and all the members and mentors within the team. A special thank you goes to the team captain. At a low point in my study and life, when the seemingly endless "dirty work" of the previous project made me increasingly anxious and I am unconsciously sensitive to the emotions and voices around me, she pulled me into the competition. Had it not been for her, I might have given up long ago.


## test
