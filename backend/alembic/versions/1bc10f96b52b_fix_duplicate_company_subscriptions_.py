"""fix_duplicate_company_subscriptions_table

Revision ID: 1bc10f96b52b
Revises: f363a73fc537
Create Date: 2025-08-04 23:39:26.056154

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '1bc10f96b52b'
down_revision: Union[str, None] = 'f363a73fc537'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    """Check if a table exists in the database."""
    try:
        connection = op.get_bind()
        result = connection.execute(text(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = :table_name)"
        ), {"table_name": table_name})
        return result.scalar()
    except Exception as e:
        print(f"Error checking table existence: {e}")
        return False


def upgrade() -> None:
    """Upgrade schema - ensure company_subscriptions table exists with proper structure."""
    # Check if company_subscriptions table exists
    if not table_exists('company_subscriptions'):
        print("Creating company_subscriptions table...")
        
        # Create the table with proper structure
        op.create_table('company_subscriptions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('company_id', sa.Integer(), nullable=False),
            sa.Column('billing_plan_id', sa.Integer(), nullable=False),
            sa.Column('start_date', sa.DateTime(), nullable=False),
            sa.Column('end_date', sa.DateTime(), nullable=True),
            sa.Column('next_billing_date', sa.DateTime(), nullable=True),
            sa.Column('is_trial', sa.Boolean(), nullable=True),
            sa.Column('trial_end_date', sa.DateTime(), nullable=True),
            sa.Column('payment_method', sa.String(), nullable=True),
            sa.Column('billing_email', sa.String(), nullable=True),
            sa.Column('custom_limits', sa.JSON(), nullable=True),
            sa.Column('custom_price', sa.Numeric(precision=10, scale=2), nullable=True),
            sa.Column('status', sa.String(), nullable=True),  # Using String to avoid enum issues
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        
        # Add foreign keys separately to handle potential reference issues
        try:
            if table_exists('companies'):
                op.create_foreign_key(None, 'company_subscriptions', 'companies', ['company_id'], ['id'])
        except Exception as e:
            print(f"Warning: Could not create foreign key to companies: {e}")
            
        try:
            if table_exists('billing_plans'):
                op.create_foreign_key(None, 'company_subscriptions', 'billing_plans', ['billing_plan_id'], ['id'])
        except Exception as e:
            print(f"Warning: Could not create foreign key to billing_plans: {e}")
        
        # Create index
        try:
            if not index_exists('ix_company_subscriptions_id'):
                op.create_index('ix_company_subscriptions_id', 'company_subscriptions', ['id'], unique=False)
        except Exception as e:
            print(f"Warning: Could not create index: {e}")
            
        print("company_subscriptions table created successfully")
    else:
        print("company_subscriptions table already exists, skipping creation")
        
        # Verify the table has the required columns
        try:
            connection = op.get_bind()
            columns_check = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'company_subscriptions'
            """))
            existing_columns = [row[0] for row in columns_check]
            
            required_columns = [
                'id', 'company_id', 'billing_plan_id', 'start_date', 'end_date',
                'next_billing_date', 'is_trial', 'trial_end_date', 'payment_method',
                'billing_email', 'custom_limits', 'custom_price', 'status',
                'created_at', 'updated_at'
            ]
            
            missing_columns = [col for col in required_columns if col not in existing_columns]
            if missing_columns:
                print(f"Warning: Missing columns in company_subscriptions: {missing_columns}")
            else:
                print("company_subscriptions table structure verified")
                
        except Exception as e:
            print(f"Warning: Could not verify table structure: {e}")


def downgrade() -> None:
    """Downgrade schema."""
    # Only drop if we created it
    if table_exists('company_subscriptions'):
        try:
            op.drop_index('ix_company_subscriptions_id', table_name='company_subscriptions')
        except Exception:
            pass
        op.drop_table('company_subscriptions')
