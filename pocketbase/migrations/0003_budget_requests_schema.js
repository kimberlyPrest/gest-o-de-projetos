migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('budget_requests')

    collection.fields.add(new TextField({ name: 'owner_id', required: true, max: 80 }))
    collection.fields.add(new TextField({ name: 'title', required: true, max: 180 }))
    collection.fields.add(new TextField({ name: 'client_name', required: true, max: 180 }))
    collection.fields.add(new TextField({ name: 'source', required: true, max: 40 }))
    collection.fields.add(new TextField({ name: 'description', max: 4000 }))
    collection.fields.add(new TextField({ name: 'technical_notes', max: 4000 }))
    collection.fields.add(new TextField({ name: 'items', max: 8000 }))
    collection.fields.add(new NumberField({ name: 'discount_percent', min: 0, max: 100 }))
    collection.fields.add(new NumberField({ name: 'total_price', min: 0 }))
    collection.fields.add(new TextField({ name: 'proposal_text', max: 12000 }))
    collection.fields.add(new TextField({ name: 'approval_notes', max: 4000 }))
    collection.fields.add(new TextField({ name: 'sent_at', max: 40 }))
    collection.fields.add(new DateField({ name: 'follow_up_at' }))
    collection.fields.add(
      new SelectField({
        name: 'status',
        values: [
          'entrada',
          'entendimento',
          'levantamento',
          'precificacao',
          'proposta',
          'aprovacao',
          'envio',
        ],
        maxSelect: 1,
      }),
    )
    collection.fields.add(new DateField({ name: 'created_at' }))

    collection.listRule = 'owner_id = @request.auth.id'
    collection.viewRule = 'owner_id = @request.auth.id'
    collection.createRule = '@request.auth.id != "" && owner_id = @request.auth.id'
    collection.updateRule = 'owner_id = @request.auth.id'
    collection.deleteRule = 'owner_id = @request.auth.id'
    collection.indexes.add('CREATE INDEX idx_budget_requests_owner ON budget_requests (owner_id)')
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('budget_requests')
    app.delete(collection)
  },
)
