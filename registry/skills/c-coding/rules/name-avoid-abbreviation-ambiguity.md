# name-avoid-abbreviation-ambiguity

> Avoid cryptic or ambiguous abbreviations in identifiers; spell out names unless the abbreviation is truly universal in context

## Why It Matters

Abbreviations save a few keystrokes while writing but cost every future reader time re-deriving what they mean, and ambiguous ones (`cnt` — count? or connect? `tmp` — temporary what?) actively mislead. C's terse tradition (`str`, `ptr`, `len`) already established a small set of universally understood abbreviations; anything beyond that small, well-known set should usually be spelled out.

## Bad

```c
int   calc_ttl_rem(struct pkt *p, int max_hp);   /* ttl? rem? hp? all ambiguous outside a very narrow context */
void  proc_req(struct req *r, struct rsp *rsp);    /* proc: process? procedure? */
char *get_usr_nm(int uid);                            /* nm: name? number? */
```

## Good

```c
int   calc_time_to_live_remaining(struct packet *p, int max_hops);
void  process_request(struct request *req, struct response *resp);
char *get_username(int user_id);
```

## Abbreviations Widely Accepted in C Without Ambiguity

```c
/* These are conventional enough to leave as-is: */
char *str;    /* string */
void *ptr;     /* pointer */
size_t len;     /* length */
int argc; char **argv;   /* argument count / argument vector: a de facto standard */
int fd;                    /* file descriptor: idiomatic in POSIX-adjacent code */
```

## See Also

- [name-snake-case-functions](name-snake-case-functions.md) - The casing convention names should follow once spelled out
- [name-verb-noun-function-names](name-verb-noun-function-names.md) - Structuring the (unabbreviated) name itself
- [doc-comment-why-not-what](doc-comment-why-not-what.md) - Good naming reduces the need for explanatory comments
