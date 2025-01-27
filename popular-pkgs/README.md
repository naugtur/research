# Top 50k npm packages

> It is theoretically possible for this to be slightly incorrect, because the list is obtained by searching the registry for all possible pairs of allowed characters ranked by downloads and then aggregating the results. It yields around 200k unique results in total, so I'm dropping the vast majority of it to make up for packages that matched the search term well but may not be valuable to look at. If registry search is right, the list by downloads should be fine and the list sorted by dependents could theoretically be missing a package that's depended upon lots of packages with very little downloads. That's not an error I'd worry about.
>  
> Yes, this took a while.

  [top 50k packages sorted by monthly downloads](./per-monthly_dl.md)
  
  [top 50k packages sorted by dependents count](./per-dependents_count.md)


----
Note to self, the latest version of fetch.js is not what produced the data, so there might be bugs I introduced when improving.