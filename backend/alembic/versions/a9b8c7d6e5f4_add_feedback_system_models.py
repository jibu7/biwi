"""Add feedback system models

Revision ID: a9b8c7d6e5f4
Revises: f5d7c8b9a1e2
Create Date: 2025-08-01 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a9b8c7d6e5f4'
down_revision: Union[str, None] = 'f5d7c8b9a1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add feedback system tables"""
    
    # Create feedback_categories table
    op.create_table('feedback_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_category_company', 'feedback_categories', ['company_id'])
    op.create_index('ix_feedback_categories_id', 'feedback_categories', ['id'])

    # Create feedback_requests table
    op.create_table('feedback_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('request_type', sa.String(), nullable=False),
        sa.Column('module', sa.String(), nullable=True),
        sa.Column('priority', sa.String(), nullable=False, default='medium'),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, default='open'),
        sa.Column('attachments', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('assigned_to_user_id', sa.Integer(), nullable=True),
        sa.Column('estimated_hours', sa.Integer(), nullable=True),
        sa.Column('actual_hours', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['assigned_to_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_feedback_assigned', 'feedback_requests', ['assigned_to_user_id'])
    op.create_index('ix_feedback_company_module', 'feedback_requests', ['company_id', 'module'])
    op.create_index('ix_feedback_company_status', 'feedback_requests', ['company_id', 'status'])
    op.create_index('ix_feedback_company_type', 'feedback_requests', ['company_id', 'request_type'])
    op.create_index('ix_feedback_requests_id', 'feedback_requests', ['id'])
    op.create_index('ix_feedback_user', 'feedback_requests', ['user_id'])

    # Create feedback_comments table
    op.create_table('feedback_comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('feedback_request_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=False),
        sa.Column('is_internal', sa.Boolean(), nullable=False, default=False),
        sa.Column('attachments', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['feedback_request_id'], ['feedback_requests.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_comment_request', 'feedback_comments', ['feedback_request_id'])
    op.create_index('ix_comment_user', 'feedback_comments', ['user_id'])
    op.create_index('ix_feedback_comments_id', 'feedback_comments', ['id'])


def downgrade() -> None:
    """Remove feedback system tables"""
    op.drop_index('ix_feedback_comments_id', table_name='feedback_comments')
    op.drop_index('ix_comment_user', table_name='feedback_comments')
    op.drop_index('ix_comment_request', table_name='feedback_comments')
    op.drop_table('feedback_comments')
    
    op.drop_index('ix_feedback_user', table_name='feedback_requests')
    op.drop_index('ix_feedback_requests_id', table_name='feedback_requests')
    op.drop_index('ix_feedback_company_type', table_name='feedback_requests')
    op.drop_index('ix_feedback_company_status', table_name='feedback_requests')
    op.drop_index('ix_feedback_company_module', table_name='feedback_requests')
    op.drop_index('ix_feedback_assigned', table_name='feedback_requests')
    op.drop_table('feedback_requests')
    
    op.drop_index('ix_feedback_categories_id', table_name='feedback_categories')
    op.drop_index('ix_category_company', table_name='feedback_categories')
    op.drop_table('feedback_categories')
