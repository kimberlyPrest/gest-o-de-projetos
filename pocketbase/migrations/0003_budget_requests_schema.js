migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('budget_requests')
    collection.listRule = 'owner_id = @request.auth.id'
    collection.viewRule = 'owner_id = @request.auth.id'
    collection.createRule = '@request.auth.id != "" && owner_id = @request.auth.id'
    collection.updateRule = 'owner_id = @request.auth.id'
    collection.deleteRule = 'owner_id = @request.auth.id'
    collection.fields = [
      { name: 'owner_id', type: 'text', required: true, max: 80 },
      { name: 'title', type: 'text', required: true, max: 180 },
      { name: 'client_name', type: 'text', required: true, max: 180 },
      { name: 'source', type: 'text', required: true, max: 40 },
      { name: 'description', type: 'text', max: 4000 },
      { name: 'technical_notes', type: 'text', max: 4000 },
      { name: 'items', type: 'text', max: 8000 },
      { name: 'discount_percent', type: 'number', min: 0, max: 100 },
      { name: 'total_price', type: 'number', min: 0 },
      { name: 'proposal_text', type: 'text', max: 12000 },
      { name: 'approval_notes', type: 'text', max: 4000 },
      { name: 'sent_at', type: 'text', max: 40 },
      { name: 'follow_up_at', type: 'date' },
      {
        name: 'status',
        type: 'select',
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
      },
      { name: 'created_at', type: 'date' },
    ]
    collection.indexes = ['CREATE INDEX idx_budget_requests_owner ON budget_requests (owner_id)']
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('budget_requests')
    collection.listRule = ''
    collection.viewRule = ''
    collection.createRule = ''
    collection.updateRule = ''
    collection.deleteRule = ''
    collection.fields = []
    collection.indexes = []
    app.save(collection)
  },
)
