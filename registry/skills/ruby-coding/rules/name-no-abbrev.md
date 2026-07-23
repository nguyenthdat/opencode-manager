# name-no-abbrev

> Avoid abbreviations except widely accepted ones

## Why It Matters

Abbreviations make code harder to read for newcomers and non-native speakers. Use full words unless the abbreviation is universally understood (req for request, id for identifier, num for number).

## Bad

```ruby
def calc_ttl_pct(usr_cnt); end
def get_msg_queue_depth; end
```


## Good

```ruby
def calculate_percentage(total, user_count); end
def get_message_queue_depth; end
# Accepted abbreviations:
def request; @request; end
def response; @response; end
```


## See Also

- [name-methods-snake-case](./name-methods-snake-case.md)
