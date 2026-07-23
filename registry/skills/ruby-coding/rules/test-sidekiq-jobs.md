# test-sidekiq-jobs

> Test Sidekiq jobs with inline mode

## Why It Matters

In test mode, configure Sidekiq to run jobs inline (synchronously) so assertions run after the job completes. Use Sidekiq::Testing.fake! to inspect enqueued jobs without executing them.

## Bad

```ruby
it "enqueues email" do
  expect { submit_order }.to enqueue_job
  # Did the email actually send? No way to verify output
end
```


## Good

```ruby
# spec/spec_helper.rb or rails_helper.rb
RSpec.configure do |config|
  config.before(:each) do
    Sidekiq::Testing.inline!  # Jobs run synchronously
  end
end

it "sends confirmation email" do
  expect {
    submit_order
  }.to change { ActionMailer::Base.deliveries.count }.by(1)

  email = ActionMailer::Base.deliveries.last
  expect(email.subject).to eq("Order Confirmed")
end
```


## See Also

- [test-request-specs](./test-request-specs.md)
