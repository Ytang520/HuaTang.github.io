---
layout: single
title: "Vibe-Lab"
permalink: /vibe-lab/
author_profile: true
vibe_lab: true
vibe_index: true
---

{% include base_path %}
{% assign vibe_ui = site.data.vibe_lab %}
{% assign vibe_entries = site.vibe_projects | sort: 'order' %}
{% assign vibe_projects = vibe_entries | where: 'kind', 'project' %}
<div class="vibe-lab">
  <div data-vibe-pinned>
  {% for project in vibe_entries %}
    {% if project.kind == 'experience' %}
      {% include vibe-lab/project-card.html project=project pinned=true %}
    {% endif %}
  {% endfor %}
  </div>
  <p class="vibe-intro">{% include vibe-lab/text.html en=vibe_ui.intro.en zh=vibe_ui.intro.zh %}</p>
  <div class="vibe-results-bar" data-vibe-results-bar hidden>
    <p class="vibe-count" role="status" aria-live="polite" aria-atomic="true"><span data-vibe-count>{{ vibe_projects.size }}</span> / <span data-vibe-total>{{ vibe_projects.size }}</span> <span data-vibe-project-label>{% include vibe-lab/text.html en=vibe_ui.projects.en zh=vibe_ui.projects.zh %}</span><span data-vibe-result-label hidden>{% include vibe-lab/text.html en=vibe_ui.results.en zh=vibe_ui.results.zh %}</span></p>
  </div>
  <div id="vibe-results" class="vibe-project-list" data-vibe-list>
    {% for project in vibe_projects %}
      {% include vibe-lab/project-card.html project=project interactive=true %}
    {% endfor %}
  </div>
  <div class="vibe-empty" data-vibe-empty hidden>
    <p>{% include vibe-lab/text.html en=vibe_ui.empty.en zh=vibe_ui.empty.zh %}</p>
    <button type="button" class="vibe-reset" data-vibe-reset-all>{% include vibe-lab/text.html en=vibe_ui.reset_all.en zh=vibe_ui.reset_all.zh %}</button>
  </div>
</div>
