---
title: "CN-travel MCP"
title_zh: "CN-travel MCP"
kind: project
card_background: cn-travel
order: 20
project_type: tool
source_model: open_source
status: maintenance
repo_url: "https://github.com/Ytang520/China-Travel-Planning-MCPs-All-in-One"
excerpt: "One MCP gateway for train tickets, flights, hotel search, maps, subway, bus and driving routes, and ride-hailing estimates in China."
summary_zh: "一个 MCP 网关，整合国内火车票、航班、酒店搜索、地图、地铁／公交／驾车路径规划与打车费用预估。"
workflow: cn-travel
workflow_intro_en: "An agent connects to one Travel MCP Gateway, which routes requests to five domains: 12306 trains, flights, hotels, Amap services, and Didi fare estimates. HotelTicketMCP searches hotels by city or landmark, dates, and guests, with price, star rating, review score, room, and breakfast filters and sorting. Amap provides location search and subway, bus, and driving routes. Map lookup and route planning share the map domain. Results return to the agent to build a travel plan; a separate agent skill guides troubleshooting from error context and reference material."
workflow_intro_zh: "Agent 通过一个连接接入 Travel MCP Gateway，网关将请求分发到火车、航班、酒店、地图和打车五个业务域。HotelTicketMCP 支持按城市或地标、日期、人数搜索酒店，并按价格、星级、评分、房型、早餐等条件筛选和排序。高德提供地点搜索及地铁、公交、驾车路径规划，地图查询与路径规划共用 map 域。结果统一返回 Agent，用于组合出行方案；另由 Agent 排障 skill 结合错误上下文和参考资料处理问题。"
workflow_note_en: "Trains support direct and connecting journeys; flight route searches are direct only. Hotel search requires enabling the hotel provider and signing in to Ctrip. Didi fare estimates use locations from Didi's own search. These tools provide queries, planning, and estimates; booking and ordering are not included."
workflow_note_zh: "火车支持直达与中转，航班路线查询仅支持直达。酒店搜索需启用酒店功能并登录携程；滴滴估价使用滴滴地点搜索返回的坐标。工具提供查询、规划和费用预估，不提供预订或下单。"
---
