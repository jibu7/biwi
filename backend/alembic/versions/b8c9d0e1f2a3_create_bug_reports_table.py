"""create bug_reports table

Revision ID: b8c9d0e1f2a3
Revises: ff859d8ad766
Create Date: 2025-08-02 01:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b8c9d0e1f2a3'
down_revision: Union[str, None] = '2887a06d6aa1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create bug_reports table
    op.create_table('bug_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('error_id', sa.String(), nullable=True),
        sa.Column('error_type', sa.String(), nullable=True),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('module', sa.String(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('stack_trace', sa.Text(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('url', sa.String(), nullable=True),
        sa.Column('request_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('response_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('occurrence_count', sa.Integer(), nullable=True),
        sa.Column('first_seen', sa.DateTime(), nullable=True),
        sa.Column('last_seen', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('error_id')
    )
    op.create_index(op.f('ix_bug_reports_company_id'), 'bug_reports', ['company_id'], unique=False)
    op.create_index(op.f('ix_bug_reports_error_type'), 'bug_reports', ['error_type'], unique=False)
    op.create_index(op.f('ix_bug_reports_severity'), 'bug_reports', ['severity'], unique=False)
    op.create_index(op.f('ix_bug_reports_status'), 'bug_reports', ['status'], unique=False)
    op.create_index(op.f('ix_bug_reports_first_seen'), 'bug_reports', ['first_seen'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_bug_reports_first_seen'), table_name='bug_reports')
    op.drop_index(op.f('ix_bug_reports_status'), table_name='bug_reports')
    op.drop_index(op.f('ix_bug_reports_severity'), table_name='bug_reports')
    op.drop_index(op.f('ix_bug_reports_error_type'), table_name='bug_reports')
    op.drop_index(op.f('ix_bug_reports_company_id'), table_name='bug_reports')
    op.drop_table('bug_reports')