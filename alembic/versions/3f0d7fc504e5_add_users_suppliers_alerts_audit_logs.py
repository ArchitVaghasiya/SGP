"""add_users_suppliers_alerts_audit_logs

Revision ID: 3f0d7fc504e5
Revises: dd83841f8382
Create Date: 2026-10-06 15:50:49.694080

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f0d7fc504e5'
down_revision: Union[str, Sequence[str], None] = 'dd83841f8382'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_email', sa.String(length=255), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.String(length=100), nullable=True),
        sa.Column('previous_state', sa.Text(), nullable=True),
        sa.Column('new_state', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_audit_logs_created', 'audit_logs', ['created_at'], unique=False)
    op.create_index('idx_audit_logs_entity', 'audit_logs', ['entity', 'entity_id'], unique=False)

    op.create_table('suppliers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('contact_name', sa.String(length=150), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('lead_time_days', sa.Integer(), nullable=False),
        sa.Column('min_order_qty', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('reliability_score', sa.Numeric(precision=4, scale=2), nullable=False),
        sa.Column('on_time_pct', sa.Numeric(precision=4, scale=2), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_suppliers_code'), 'suppliers', ['code'], unique=True)

    op.create_table('users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    op.create_table('stock_alerts',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('alert_type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('store_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.product_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['store_id'], ['stores.store_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_alerts_severity', 'stock_alerts', ['severity'], unique=False)
    op.create_index('idx_alerts_status', 'stock_alerts', ['status'], unique=False)
    op.create_index('idx_alerts_store_prod', 'stock_alerts', ['store_id', 'product_id', 'status'], unique=False)

    op.add_column('inventory_transactions', sa.Column('created_by', sa.String(length=100), nullable=True))
    op.add_column('products', sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('products', sa.Column('supplier_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_products_supplier_id', 'products', 'suppliers', ['supplier_id'], ['id'], ondelete='SET NULL')

    op.add_column('purchase_orders', sa.Column('po_number', sa.String(length=50), nullable=True))
    op.add_column('purchase_orders', sa.Column('supplier_id', sa.Integer(), nullable=True))
    op.add_column('purchase_orders', sa.Column('unit_cost', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('purchase_orders', sa.Column('total_cost', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('purchase_orders', sa.Column('expected_delivery_date', sa.Date(), nullable=True))
    op.add_column('purchase_orders', sa.Column('created_by', sa.String(length=100), nullable=True))
    op.create_unique_constraint('uq_purchase_orders_po_number', 'purchase_orders', ['po_number'])
    op.create_foreign_key('fk_purchase_orders_supplier_id', 'purchase_orders', 'suppliers', ['supplier_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_purchase_orders_supplier_id', 'purchase_orders', type_='foreignkey')
    op.drop_constraint('uq_purchase_orders_po_number', 'purchase_orders', type_='unique')
    op.drop_column('purchase_orders', 'created_by')
    op.drop_column('purchase_orders', 'expected_delivery_date')
    op.drop_column('purchase_orders', 'total_cost')
    op.drop_column('purchase_orders', 'unit_cost')
    op.drop_column('purchase_orders', 'supplier_id')
    op.drop_column('purchase_orders', 'po_number')

    op.drop_constraint('fk_products_supplier_id', 'products', type_='foreignkey')
    op.drop_column('products', 'supplier_id')
    op.drop_column('products', 'unit_price')

    op.drop_column('inventory_transactions', 'created_by')

    op.drop_index('idx_alerts_store_prod', table_name='stock_alerts')
    op.drop_index('idx_alerts_status', table_name='stock_alerts')
    op.drop_index('idx_alerts_severity', table_name='stock_alerts')
    op.drop_table('stock_alerts')

    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

    op.drop_index(op.f('ix_suppliers_code'), table_name='suppliers')
    op.drop_table('suppliers')

    op.drop_index('idx_audit_logs_entity', table_name='audit_logs')
    op.drop_index('idx_audit_logs_created', table_name='audit_logs')
    op.drop_table('audit_logs')
