---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

{% include base_path %}
{% assign author = site.author %}

<p>
  <a href="https://scholar.google.com/citations?user=uDetv2UAAAAJ&hl=en" target="_blank" style="text-decoration: none;">
    <i class="fas fa-fw fa-graduation-cap" style="font-size: 1.2em;"></i> Find my articles on Google Scholar
  </a>
</p>



{% for post in site.publications reversed %}
  {% include archive-single.html %}
{% endfor %}
